import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_test_secret_test_secret_123";
process.env.CORS_ORIGINS = "http://localhost:3000";

let mongod, server, base;
const GOOD = { origin: "http://localhost:3000" };

async function call(method, path, { body, cookie, headers } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const setCookie = res.headers.get("set-cookie") || "";
  return { status: res.status, json: await res.json().catch(() => null), setCookie, cookie: setCookie.split(";")[0], headers: res.headers };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const app = (await import("../src/server.js")).default;
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
  await mongod?.stop();
});

const reg = { name: "An", username: "an_nguyen", email: "an@example.com", password: "Passw0rd1" };

test("health check báo DB up và trả X-Request-Id", async () => {
  const r = await call("GET", "/api/health", { headers: { "x-request-id": "abc-123" } });
  assert.equal(r.status, 200);
  assert.equal(r.json.db, "up");
  assert.equal(r.headers.get("x-request-id"), "abc-123");
});

test("đăng ký: mật khẩu yếu/định dạng sai bị từ chối; trùng bị từ chối", async () => {
  assert.equal((await call("POST", "/api/auth/register", { body: { ...reg, password: "abc" } })).status, 400);
  assert.equal((await call("POST", "/api/auth/register", { body: { ...reg, password: "onlyletters" } })).status, 400);
  assert.equal((await call("POST", "/api/auth/register", { body: { ...reg, email: "not-an-email" } })).status, 400);
  assert.equal((await call("POST", "/api/auth/register", { body: { ...reg, username: { $ne: "x" } } })).status, 400);
  assert.equal((await call("POST", "/api/auth/register", { body: reg })).status, 201);
  assert.equal((await call("POST", "/api/auth/register", { body: reg })).status, 400);
});

test("đăng nhập đặt cookie httpOnly, không trả token trong body; /me dùng cookie", async () => {
  const bad = await call("POST", "/api/auth/login", { body: { identifier: "an@example.com", password: "Wrong1234" } });
  assert.equal(bad.status, 400);
  const r = await call("POST", "/api/auth/login", { body: { identifier: "AN@example.com", password: reg.password } });
  assert.equal(r.status, 200);
  assert.equal(r.json.token, undefined);
  assert.match(r.setCookie, /HttpOnly/i);
  assert.match(r.setCookie, /SameSite=Lax/i);
  const me = await call("GET", "/api/auth/me", { cookie: r.cookie });
  assert.equal(me.status, 200);
  assert.equal(me.json.email, "an@example.com");
  assert.equal(me.json.password, undefined);
  assert.equal((await call("GET", "/api/auth/me")).status, 401);
});

test("CSRF: request ghi dữ liệu bằng cookie từ origin lạ hoặc thiếu Origin bị chặn", async () => {
  const r = await call("POST", "/api/auth/login", { body: { identifier: reg.email, password: reg.password } });
  const put = (headers) => call("PUT", "/api/auth/me", { cookie: r.cookie, headers, body: { name: "An B" } });
  assert.equal((await put({})).status, 403);
  assert.equal((await put({ origin: "https://evil.example" })).status, 403);
  assert.equal((await put(GOOD)).status, 200);
});

test("đổi mật khẩu thu hồi phiên cũ; logout xóa cookie", async () => {
  const s1 = await call("POST", "/api/auth/login", { body: { identifier: reg.email, password: reg.password } });
  const s2 = await call("POST", "/api/auth/login", { body: { identifier: reg.email, password: reg.password } });
  const change = await call("POST", "/api/auth/change-password", {
    cookie: s1.cookie,
    headers: GOOD,
    body: { currentPassword: reg.password, newPassword: "NewPassw0rd2" }
  });
  assert.equal(change.status, 200);
  assert.equal((await call("GET", "/api/auth/me", { cookie: s2.cookie })).status, 401); // phiên khác bị thu hồi
  assert.equal((await call("GET", "/api/auth/me", { cookie: change.cookie })).status, 200); // phiên hiện tại được cấp mới
  const out = await call("POST", "/api/auth/logout", { cookie: change.cookie, headers: GOOD });
  assert.equal(out.status, 200);
  assert.match(out.setCookie, /ms_token=;/);
});

test("quên mật khẩu không lộ email tồn tại; upload ảnh giả bị từ chối", async () => {
  const a = await call("POST", "/api/auth/forgot-password", { body: { email: "an@example.com" } });
  const b = await call("POST", "/api/auth/forgot-password", { body: { email: "nobody@example.com" } });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  const fd = new FormData();
  fd.append("image", new Blob([Buffer.from("<?php echo 1; ?>")], { type: "image/png" }), "shell.png");
  const up = await fetch(base + "/api/uploads/payment-proof", { method: "POST", body: fd });
  assert.equal(up.status, 400); // magic bytes không phải PNG
});

test("login bị giới hạn tốc độ sau nhiều lần sai", async () => {
  let last = 0;
  for (let i = 0; i < 12; i++) {
    last = (await call("POST", "/api/auth/login", { body: { identifier: "x@example.com", password: "Wrong1234" } })).status;
  }
  assert.equal(last, 429);
});
