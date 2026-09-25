import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryReplSet, MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_test_secret_test_secret_123";
process.env.CORS_ORIGINS = "http://localhost:3000";

let repl, server, base;
const ORIGIN = { origin: "http://localhost:3000" };

async function call(method, path, { body, cookie } = {}) {
  const res = await fetch(base + "/api" + path, {
    method,
    headers: { "content-type": "application/json", ...ORIGIN, ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, cookie: (res.headers.get("set-cookie") || "").split(";")[0] };
}

async function makeUser(User, role, name) {
  const email = `${name}@t.test`;
  await User.create({ name, username: name, email, password: await bcrypt.hash("Passw0rdX", 4), role });
  const r = await call("POST", "/auth/login", { body: { identifier: email, password: "Passw0rdX" } });
  assert.equal(r.status, 200);
  assert.ok(r.cookie.startsWith("ms_token="));
  return r.cookie;
}

let Product, Order, Coupon, User, adminCookie, userCookie;

before(async () => {
  // TEST_STANDALONE=1: kiểm tra nhánh không có transaction (Mongo đơn lẻ, không replica set)
  repl = process.env.TEST_STANDALONE ? await MongoMemoryServer.create() : await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(repl.getUri());
  ({ Product } = await import("../src/models/Product.js"));
  ({ Order } = await import("../src/models/Order.js"));
  ({ Coupon } = await import("../src/models/Coupon.js"));
  ({ User } = await import("../src/models/User.js"));
  const { PaymentConfig } = await import("../src/models/PaymentConfig.js");
  await PaymentConfig.create({ bankAccount: "123456789", bankName: "ACB" });
  await Order.init();
  await Coupon.init();
  const app = (await import("../src/server.js")).default;
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
  adminCookie = await makeUser(User, "admin", "boss");
  userCookie = await makeUser(User, "user", "cust");
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await repl?.stop();
});

const addr = { phone: "0901234567", address: "12 Nguyen Hue, Q1", deliveryType: "delivery" };
const line = (p, quantity = 1) => [{ product: String(p._id), quantity }];

test("không oversell khi nhiều đơn đồng thời (stock=1, 6 đơn)", async () => {
  const p = await Product.create({ name: "Race", price: 100000, category: "HG", stock: 1 });
  const results = await Promise.all(
    Array.from({ length: 6 }, () => call("POST", "/orders", { cookie: userCookie, body: { ...addr, items: line(p) } }))
  );
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal((await Product.findById(p._id)).stock, 0);
});

test("hủy đơn hoàn kho đúng 1 lần dù bấm đồng thời; state machine chặn đường đi sai", async () => {
  const p = await Product.create({ name: "Cancel", price: 200000, category: "HG", stock: 5 });
  const o = await call("POST", "/orders", { cookie: userCookie, body: { ...addr, items: line(p, 2) } });
  assert.equal(o.status, 201);
  assert.equal((await Product.findById(p._id)).stock, 3);
  const id = o.json._id;
  const [a, b] = await Promise.all([
    call("POST", `/orders/${id}/cancel`, { cookie: userCookie, body: {} }),
    call("PUT", `/orders/${id}`, { cookie: adminCookie, body: { status: "cancelled" } })
  ]);
  assert.equal([a, b].filter((r) => r.status === 200).length, 1, JSON.stringify([a.json, b.json]));
  assert.equal((await Product.findById(p._id)).stock, 5);
  const back = await call("PUT", `/orders/${id}`, { cookie: adminCookie, body: { status: "processing" } });
  assert.equal(back.status, 400);
});

test("luồng pending→processing→shipped→delivered, COD tự thanh toán khi giao", async () => {
  const p = await Product.create({ name: "Flow", price: 50000, category: "HG", stock: 5 });
  const o = await call("POST", "/orders", { cookie: userCookie, body: { ...addr, items: line(p) } });
  const id = o.json._id;
  assert.equal((await call("PUT", `/orders/${id}`, { cookie: adminCookie, body: { status: "delivered" } })).status, 400);
  for (const s of ["processing", "shipped", "delivered"]) {
    assert.equal((await call("PUT", `/orders/${id}`, { cookie: adminCookie, body: { status: s } })).status, 200);
  }
  assert.equal((await Order.findById(id)).paymentStatus, "paid");
  assert.equal((await call("PUT", `/orders/${id}`, { cookie: adminCookie, body: { status: "cancelled" } })).status, 400);
});

test("khách vãng lai: token đơn bắt buộc, sai token không xem/hủy được", async () => {
  const p = await Product.create({ name: "Guest", price: 70000, category: "HG", stock: 3 });
  const o = await call("POST", "/orders", { body: { ...addr, recipientName: "Khach", guestEmail: "khach@example.com", items: line(p) } });
  assert.equal(o.status, 201);
  const noEmail = await call("POST", "/orders", { body: { ...addr, recipientName: "Khach", items: line(p) } });
  assert.equal(noEmail.status, 400); // khách vãng lai bắt buộc có email
  const { _id, accessToken } = o.json;
  assert.ok(accessToken && accessToken.length >= 32);
  assert.equal((await call("GET", `/orders/guest/${_id}?token=wrongwrongwrongwrong`)).status, 404);
  assert.equal((await call("GET", `/orders/guest/${_id}?phone=${addr.phone}`)).status, 400);
  assert.equal((await call("GET", `/orders/guest/${_id}?token=${accessToken}`)).status, 200);
  assert.equal((await call("POST", `/orders/${_id}/cancel`, { body: { token: "x".repeat(40) } })).status, 404);
  assert.equal((await call("POST", `/orders/${_id}/cancel`, { body: { token: accessToken } })).status, 200);
  assert.equal((await Product.findById(p._id)).stock, 3);
  assert.equal((await Order.findById(_id)).accessToken, undefined); // không lộ khi đọc bình thường
});

test("mã giảm giá: usageLimit không bị vượt; hủy đơn trả lượt và cho dùng lại", async () => {
  const p = await Product.create({ name: "Coupon", price: 1000000, category: "HG", stock: 10 });
  await Coupon.create({ code: "ONCE", type: "fixed", value: 50000, usageLimit: 1 });
  const other = await makeUser(User, "user", "cust2");
  const body = { ...addr, couponCode: "ONCE", items: line(p) };
  const rs = await Promise.all([
    call("POST", "/orders", { cookie: userCookie, body }),
    call("POST", "/orders", { cookie: other, body })
  ]);
  assert.equal(rs.filter((r) => r.status === 201).length, 1);
  assert.equal((await Coupon.findOne({ code: "ONCE" })).usedCount, 1);
  const win = rs.find((r) => r.status === 201);
  const cookie = win === rs[0] ? userCookie : other;
  assert.equal((await call("POST", `/orders/${win.json._id}/cancel`, { cookie, body: {} })).status, 200);
  assert.equal((await Coupon.findOne({ code: "ONCE" })).usedCount, 0);
  assert.equal((await call("POST", "/orders", { cookie, body })).status, 201);
});

test("đơn đã thanh toán không thể hủy khi chưa duyệt hoàn tiền; số lượng không hợp lệ bị từ chối", async () => {
  const p = await Product.create({ name: "Paid", price: 90000, category: "HG", stock: 4 });
  const o = await call("POST", "/orders", {
    cookie: userCookie,
    body: { ...addr, paymentMethod: "bank_transfer", items: line(p) }
  });
  const id = o.json._id;
  assert.equal((await call("PUT", `/orders/${id}/payment`, { cookie: adminCookie, body: { paymentStatus: "paid" } })).status, 200);
  assert.equal((await call("POST", `/orders/${id}/cancel`, { cookie: userCookie, body: {} })).status, 400);
  assert.equal((await call("PUT", `/orders/${id}`, { cookie: adminCookie, body: { status: "cancelled" } })).status, 400);
  assert.equal((await call("POST", "/orders", { cookie: userCookie, body: { ...addr, items: line(p, 1.5) } })).status, 400);
  assert.equal((await call("POST", "/orders", { cookie: userCookie, body: { ...addr, items: line(p, -1) } })).status, 400);
});

test("cấu hình checkout công khai khớp phí ship server dùng để tính đơn", async () => {
  const cfg = await call("GET", "/payment-config/checkout");
  assert.equal(cfg.status, 200);
  const p = await Product.create({ name: "Ship", price: 100000, category: "HG", stock: 3 });
  const o = await call("POST", "/orders", { cookie: userCookie, body: { ...addr, items: line(p) } });
  assert.equal(o.json.shippingFee, cfg.json.shippingFlatFee);
  const pickup = await call("POST", "/orders", { cookie: userCookie, body: { phone: addr.phone, deliveryType: "pickup", items: line(p) } });
  assert.equal(pickup.status, 201);
  assert.equal(pickup.json.shippingFee, 0);
  assert.equal(pickup.json.address, cfg.json.pickupAddress);
});
