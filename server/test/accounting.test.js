import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryReplSet } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_test_secret_test_secret_123";
process.env.CORS_ORIGINS = "http://localhost:3000";

let repl, server, base;
let Product, Order, User, JournalEntry, Account, PaymentConfig, ApprovalRequest;
let admin, staff, accountant, accountant2, customer;

async function call(method, path, { body, cookie } = {}) {
  const res = await fetch(base + "/api" + path, {
    method,
    headers: { "content-type": "application/json", origin: "http://localhost:3000", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, json: await res.json().catch(() => null), cookie: (res.headers.get("set-cookie") || "").split(";")[0] };
}

async function makeUser(role, name) {
  const email = `${name}@t.test`;
  await User.create({ name, username: name, email, password: await bcrypt.hash("Passw0rdX", 4), role });
  const r = await call("POST", "/auth/login", { body: { identifier: email, password: "Passw0rdX" } });
  assert.equal(r.status, 200);
  return r.cookie;
}

/** Số dư (Nợ - Có) theo mã tài khoản từ sổ nhật ký */
async function balances() {
  const rows = await JournalEntry.aggregate([
    { $unwind: "$lines" },
    { $group: { _id: "$lines.account", debit: { $sum: "$lines.debit" }, credit: { $sum: "$lines.credit" } } }
  ]);
  const accs = await Account.find().lean();
  const code = new Map(accs.map((a) => [String(a._id), a.code]));
  return Object.fromEntries(rows.map((r) => [code.get(String(r._id)), r.debit - r.credit]));
}

before(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(repl.getUri());
  ({ Product } = await import("../src/models/Product.js"));
  ({ Order } = await import("../src/models/Order.js"));
  ({ User } = await import("../src/models/User.js"));
  ({ JournalEntry } = await import("../src/models/JournalEntry.js"));
  ({ Account } = await import("../src/models/Account.js"));
  ({ PaymentConfig } = await import("../src/models/PaymentConfig.js"));
  ({ ApprovalRequest } = await import("../src/models/ApprovalRequest.js"));
  await JournalEntry.init();
  await Order.init();
  const app = (await import("../src/server.js")).default;
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
  admin = await makeUser("admin", "boss");
  staff = await makeUser("staff", "shopstaff");
  accountant = await makeUser("accountant", "acct1");
  accountant2 = await makeUser("accountant", "acct2");
  customer = await makeUser("user", "buyer");
  await PaymentConfig.create({ bankAccount: "123456789", bankName: "ACB" });
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await repl?.stop();
});

const addr = { phone: "0901234567", address: "12 Nguyen Hue, Q1", deliveryType: "delivery" };
const item = (p, q = 1) => [{ product: String(p._id), quantity: q }];

async function deliver(orderId) {
  for (const s of ["processing", "shipped", "delivered"]) {
    const r = await call("PUT", `/orders/${orderId}`, { cookie: staff, body: { status: s } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
  }
}

test("phân quyền: staff không vào kế toán/duyệt; accountant không sửa sản phẩm; customer bị chặn", async () => {
  assert.equal((await call("GET", "/admin/journal-entries", { cookie: staff })).status, 403);
  assert.equal((await call("GET", "/admin/journal-entries", { cookie: accountant })).status, 200);
  assert.equal((await call("POST", "/products", { cookie: accountant, body: { name: "x", price: 1, category: "HG" } })).status, 403);
  assert.equal((await call("POST", "/products", { cookie: staff, body: { name: "x", price: 1, category: "HG" } })).status, 201);
  assert.equal((await call("GET", "/admin/approvals", { cookie: customer })).status, 403);
  assert.equal((await call("GET", "/admin/payment-config", { cookie: staff })).status, 403);
  assert.equal((await call("GET", "/admin/payment-config", { cookie: admin })).status, 200);
});

test("giao hàng COD tự sinh hóa đơn + doanh thu + giá vốn + thu tiền, không ghi trùng khi đối soát", async () => {
  const p = await Product.create({ name: "Acct", price: 100000, cost: 60000, category: "HG", stock: 5 });
  const o = await call("POST", "/orders", { cookie: customer, body: { ...addr, shippingIgnored: true, items: item(p) } });
  assert.equal(o.status, 201);
  const total = o.json.totalPrice; // gồm phí ship
  await deliver(o.json._id);

  let b = await balances();
  assert.equal(b["131"], 0); // đã thu tiền
  assert.equal(b["111"], total);
  assert.equal(b["511"], -total);
  assert.equal(b["632"], 60000);
  assert.equal(b["156"], -60000);

  const r = await call("POST", "/admin/accounting/reconcile", { cookie: accountant });
  assert.equal(r.status, 200);
  const b2 = await balances();
  assert.deepEqual(b2, b);
  assert.equal((await Order.findById(o.json._id)).cogsAmount, 60000);
});

test("bút toán không cân bị từ chối", async () => {
  const { postEntry } = await import("../src/services/accounting.js");
  await assert.rejects(() => postEntry({ refType: "x", refId: "1", lines: [{ code: "111", debit: 100 }, { code: "511", credit: 90 }] }));
});

test("hoàn tiền: cần lý do, người duyệt khác, thực hiện nguyên tử, ghi sổ, nhập kho khi nhận hàng về", async () => {
  const p = await Product.create({ name: "Refund", price: 200000, cost: 120000, category: "HG", stock: 3 });
  const o = await call("POST", "/orders", { cookie: customer, body: { ...addr, deliveryType: "pickup", items: item(p) } });
  const id = o.json._id;
  const total = o.json.totalPrice;
  await deliver(id); // COD → đã thu tiền, đã ghi sổ
  assert.equal((await Product.findById(p._id)).stock, 2);

  assert.equal((await call("POST", `/orders/${id}/refund-request`, { cookie: staff, body: {} })).status, 400); // thiếu lý do
  assert.equal((await call("POST", `/orders/${id}/refund-request`, { cookie: staff, body: { reason: "x", amount: total + 1 } })).status, 400);
  const rq = await call("POST", `/orders/${id}/refund-request`, { cookie: staff, body: { reason: "Hàng lỗi" } });
  assert.equal(rq.status, 201);
  assert.equal((await call("POST", `/orders/${id}/refund/execute`, { cookie: accountant })).status, 400); // chưa duyệt
  assert.equal((await call("POST", `/admin/approvals/${rq.json.approval._id}/decide`, { cookie: staff, body: { status: "approved" } })).status, 403);
  assert.equal((await call("POST", `/admin/approvals/${rq.json.approval._id}/decide`, { cookie: accountant, body: { status: "approved" } })).status, 200);

  const [e1, e2] = await Promise.all([
    call("POST", `/orders/${id}/refund/execute`, { cookie: accountant, body: { restock: true } }),
    call("POST", `/orders/${id}/refund/execute`, { cookie: accountant2, body: { restock: true } })
  ]);
  assert.equal([e1, e2].filter((r) => r.status === 200).length, 1, JSON.stringify([e1.json, e2.json]));
  assert.equal((await Product.findById(p._id)).stock, 3); // nhập kho đúng 1 lần
  const order = await Order.findById(id);
  assert.equal(order.refundStatus, "refunded");

  const b = await balances();
  assert.equal(b["5211"], total); // giảm trừ doanh thu
  assert.equal(b["632"], 60000 + 0, "COGS đơn trước 60k + đơn này đã đảo"); // 60k của đơn 1, đơn này 120k-120k=0
  // doanh thu thuần từ KPI
  const kpi = await call("GET", "/admin/reports/finance-kpis", { cookie: accountant });
  assert.equal(kpi.status, 200);
  assert.ok(kpi.json.totals.refundCount >= 1);
  assert.equal((await call("POST", `/orders/${id}/refund/execute`, { cookie: accountant, body: {} })).status, 400);
});

test("hoàn tiền đơn chưa giao (đã chuyển khoản): tự hủy đơn, hoàn kho, không phát sinh bút toán", async () => {
  const p = await Product.create({ name: "Prepaid", price: 150000, cost: 90000, category: "HG", stock: 2 });
  const o = await call("POST", "/orders", { cookie: customer, body: { ...addr, paymentMethod: "bank_transfer", items: item(p) } });
  assert.equal(o.status, 201);
  const id = o.json._id;
  assert.equal((await Product.findById(p._id)).stock, 1);
  assert.equal((await call("PUT", `/orders/${id}/payment`, { cookie: staff, body: { paymentStatus: "paid" } })).status, 200);
  const before = await JournalEntry.countDocuments();
  const rq = await call("POST", `/orders/${id}/refund-request`, { cookie: staff, body: { reason: "Khách đổi ý" } });
  await call("POST", `/admin/approvals/${rq.json.approval._id}/decide`, { cookie: accountant, body: { status: "approved" } });
  const ex = await call("POST", `/orders/${id}/refund/execute`, { cookie: accountant });
  assert.equal(ex.status, 200);
  const o2 = await Order.findById(id);
  assert.equal(o2.status, "cancelled");
  assert.equal(o2.refundStatus, "refunded");
  assert.equal((await Product.findById(p._id)).stock, 2);
  assert.equal(await JournalEntry.countDocuments(), before);
});

test("chi phí ghi sổ Nợ 641 / Có 111, sửa và xóa cập nhật sổ", async () => {
  const b0 = await balances();
  const e = await call("POST", "/admin/expenses", { cookie: accountant, body: { title: "Quảng cáo", amount: 500000 } });
  assert.equal(e.status, 201);
  let b = await balances();
  assert.equal(b["641"], (b0["641"] || 0) + 500000);
  await call("PUT", `/admin/expenses/${e.json._id}`, { cookie: accountant, body: { amount: 300000 } });
  b = await balances();
  assert.equal(b["641"], (b0["641"] || 0) + 300000);
  await call("DELETE", `/admin/expenses/${e.json._id}`, { cookie: accountant });
  b = await balances();
  assert.equal(b["641"] || 0, b0["641"] || 0);
});

test("phương thức thanh toán chưa cấu hình bị từ chối; hóa đơn thủ công chặn sửa số tiền/mass-assign", async () => {
  const p = await Product.create({ name: "PM", price: 10000, category: "HG", stock: 5 });
  const r = await call("POST", "/orders", { cookie: customer, body: { ...addr, paymentMethod: "momo", items: item(p) } });
  assert.equal(r.status, 400);
  const inv = await call("POST", "/admin/invoices", { cookie: accountant, body: { customerName: "ACME", subtotal: 1000, taxAmount: 100, status: "paid", totalAmount: 1 } });
  assert.equal(inv.status, 201);
  assert.equal(inv.json.status, "draft");
  assert.equal(inv.json.totalAmount, 1100);
  const bad = await call("PUT", `/admin/invoices/${inv.json._id}`, { cookie: accountant, body: { status: "paid" } });
  assert.equal(bad.status, 400); // draft → paid không hợp lệ
  assert.equal((await call("PUT", `/admin/invoices/${inv.json._id}`, { cookie: accountant, body: { status: "posted" } })).status, 200);
  assert.equal((await call("PUT", `/admin/invoices/${inv.json._id}`, { cookie: accountant, body: { status: "paid" } })).status, 200);
});
