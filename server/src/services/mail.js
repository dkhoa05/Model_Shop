import nodemailer from "nodemailer";

/** Bỏ ngoặc kép nếu .env ghi nhầm dạng SMTP_USER="a@b.com" mà parser giữ lại dấu " */
function envPlain(v) {
  if (v == null) return "";
  let s = String(v).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatVnd(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(Math.round(x)) + " đ";
}

function paymentMethodLabel(pm) {
  const m = {
    cod: "Thanh toán khi nhận hàng (COD)",
    bank_transfer: "Chuyển khoản ngân hàng",
    momo: "Ví MoMo",
    zalopay: "ZaloPay"
  };
  return m[pm] || String(pm || "");
}

function deliveryLabel(dt) {
  return dt === "pickup" ? "Nhận tại cửa hàng" : "Giao tận nơi";
}

/** @returns {{ transporter: import('nodemailer').Transporter, from: string } | null} */
function getMailConfig() {
  const host = envPlain(process.env.SMTP_HOST);
  const user = envPlain(process.env.SMTP_USER);
  const pass = envPlain(process.env.SMTP_PASS);

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;
  const from = envPlain(process.env.MAIL_FROM) || `Model Shop <${user}>`;

  const useRequireTls =
    !secure &&
    (process.env.SMTP_REQUIRE_TLS === "true" || /gmail\.com/i.test(host));

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(useRequireTls ? { requireTLS: true } : {})
  });

  return { transporter, from };
}

function orderItemsRowsHtml(order) {
  const items = order?.items || [];
  return items
    .map((row) => {
      const name =
        row.product && typeof row.product === "object" && row.product.name
          ? row.product.name
          : "Sản phẩm";
      const safeName = escapeHtml(name);
      return `<tr>
  <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${safeName}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${escapeHtml(String(row.quantity))}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatVnd(row.price)}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatVnd(row.price * row.quantity)}</td>
</tr>`;
    })
    .join("");
}

function orderSummaryBlock(order, refLabel) {
  const safeRef = escapeHtml(refLabel);
  const safeAddr = escapeHtml(order.address || "");
  const safePhone = escapeHtml(order.phone || "");
  return `<p style="margin:0 0 8px;"><strong>Mã tham chiếu:</strong> ${safeRef}</p>
<p style="margin:0 0 8px;"><strong>Người nhận:</strong> ${escapeHtml(order.recipientName || "")}</p>
<p style="margin:0 0 8px;"><strong>SĐT:</strong> ${safePhone}</p>
<p style="margin:0 0 8px;"><strong>Hình thức:</strong> ${escapeHtml(deliveryLabel(order.deliveryType))}</p>
<p style="margin:0 0 16px;"><strong>Địa chỉ / điểm nhận:</strong> ${safeAddr}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">
  <thead><tr style="background:#f1f5f9;">
    <th align="left" style="padding:8px 12px;">Sản phẩm</th>
    <th style="padding:8px 12px;">SL</th>
    <th align="right" style="padding:8px 12px;">Đơn giá</th>
    <th align="right" style="padding:8px 12px;">Thành tiền</th>
  </tr></thead>
  <tbody>${orderItemsRowsHtml(order)}</tbody>
</table>
<p style="margin:0 0 4px;"><strong>Tạm tính:</strong> ${formatVnd(order.subtotal)}</p>
<p style="margin:0 0 4px;"><strong>Phí giao:</strong> ${formatVnd(order.shippingFee)}</p>
<p style="margin:0 0 4px;"><strong>Giảm giá:</strong> ${formatVnd(order.discountAmount)}</p>
<p style="margin:0 0 16px;font-size:18px;"><strong>Tổng cộng:</strong> ${formatVnd(order.totalPrice)}</p>
<p style="margin:0 0 8px;"><strong>Phương thức thanh toán:</strong> ${escapeHtml(paymentMethodLabel(order.paymentMethod))}</p>`;
}

/**
 * Gửi email đặt lại mật khẩu. Cần biến môi trường SMTP_* (xem .env.example).
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendPasswordResetEmail({ to, name, resetLink }) {
  const cfg = getMailConfig();
  if (!cfg) {
    console.warn("[mail] Thiếu SMTP_HOST / SMTP_USER / SMTP_PASS — bỏ qua gửi email.");
    return { sent: false, reason: "not_configured" };
  }

  const subject = "Đặt lại mật khẩu — Model Shop";
  const safeName = name ? escapeHtml(name) : "";
  const safeLink = escapeHtml(resetLink);

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b;background:#f8fafc;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(15,23,42,.08);overflow:hidden;">
    <tr><td style="padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:16px;">Xin chào${safeName ? ` <strong>${safeName}</strong>` : ""},</p>
      <p style="margin:0 0 16px;">Bạn vừa yêu cầu <strong>đặt lại mật khẩu</strong> cho tài khoản Model Shop.</p>
      <p style="margin:0 0 20px;">Nhấn nút bên dưới (link có hiệu lực <strong>1 giờ</strong>):</p>
      <p style="margin:0 0 16px;">
        <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background:#e11d48;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Đặt lại mật khẩu</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Hoặc copy đường link sau vào trình duyệt:</p>
      <p style="margin:0;font-size:12px;word-break:break-all;color:#475569;">${safeLink}</p>
      <p style="margin:24px 0 0;font-size:13px;color:#64748b;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Xin chào${name ? ` ${name}` : ""},

Đặt lại mật khẩu Model Shop (hiệu lực 1 giờ):
${resetLink}

Nếu bạn không yêu cầu, bỏ qua email này.`;

  try {
    await cfg.transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error("[mail] Gửi email thất bại:", err);
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Email khi thanh toán đã được xác nhận (admin đánh dấu đã thanh toán).
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendPaymentSuccessEmail({ to, recipientName, order }) {
  const cfg = getMailConfig();
  if (!cfg) {
    console.warn("[mail] Thiếu SMTP — bỏ qua email thanh toán thành công.");
    return { sent: false, reason: "not_configured" };
  }
  if (!to || typeof to !== "string" || !to.trim()) {
    return { sent: false, reason: "no_email" };
  }

  const ref = order.paymentRef || String(order._id);
  const safeName = recipientName ? escapeHtml(recipientName) : "";
  const paidAt = order.paidAt ? new Date(order.paidAt).toLocaleString("vi-VN") : "";
  const subject = `Model Shop — Đã xác nhận thanh toán (${ref})`;
  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b;background:#f8fafc;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(15,23,42,.08);overflow:hidden;">
    <tr><td style="padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:16px;">Xin chào${safeName ? ` <strong>${safeName}</strong>` : ""},</p>
      <p style="margin:0 0 16px;">Thanh toán cho đơn hàng <strong>${escapeHtml(ref)}</strong> đã được <strong style="color:#15803d;">xác nhận</strong>${paidAt ? ` (${escapeHtml(paidAt)})` : ""}.</p>
      ${orderSummaryBlock(order, ref)}
      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Đơn sẽ được xử lý và giao theo thông tin trên. Cảm ơn bạn đã mua hàng tại Model Shop.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Xin chào${recipientName ? ` ${recipientName}` : ""},`,
    "",
    `Thanh toán đơn ${ref} đã được xác nhận.`,
    `Tổng: ${formatVnd(order.totalPrice)}`,
    ""
  ].join("\n");

  try {
    await cfg.transporter.sendMail({ from: cfg.from, to: to.trim(), subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error("[mail] Gửi email thanh toán thất bại:", err);
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Email khi đơn chuyển sang trạng thái đã giao (delivered).
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendOrderDeliveredEmail({ to, recipientName, order }) {
  const cfg = getMailConfig();
  if (!cfg) {
    console.warn("[mail] Thiếu SMTP — bỏ qua email đã giao hàng.");
    return { sent: false, reason: "not_configured" };
  }
  if (!to || typeof to !== "string" || !to.trim()) {
    return { sent: false, reason: "no_email" };
  }

  const ref = order.paymentRef || String(order._id);
  const safeName = recipientName ? escapeHtml(recipientName) : "";
  const subject = `Model Shop — Đơn hàng đã giao (${ref})`;
  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b;background:#f8fafc;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(15,23,42,.08);overflow:hidden;">
    <tr><td style="padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:16px;">Xin chào${safeName ? ` <strong>${safeName}</strong>` : ""},</p>
      <p style="margin:0 0 16px;">Đơn hàng <strong>${escapeHtml(ref)}</strong> đã được <strong style="color:#15803d;">giao hoàn tất</strong>. Cảm ơn bạn đã mua hàng tại Model Shop.</p>
      ${orderSummaryBlock(order, ref)}
      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Nếu có thắc mắc về sản phẩm, vui lòng liên hệ shop qua số điện thoại hoặc kênh hỗ trợ trên website.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Xin chào${recipientName ? ` ${recipientName}` : ""},`,
    "",
    `Đơn ${ref} đã giao hoàn tất.`,
    `Tổng: ${formatVnd(order.totalPrice)}`,
    ""
  ].join("\n");

  try {
    await cfg.transporter.sendMail({ from: cfg.from, to: to.trim(), subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error("[mail] Gửi email đã giao hàng thất bại:", err);
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Email khi đơn bị hủy (khách hoặc admin).
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendOrderCancelledEmail({ to, recipientName, order }) {
  const cfg = getMailConfig();
  if (!cfg) {
    console.warn("[mail] Thiếu SMTP — bỏ qua email hủy đơn.");
    return { sent: false, reason: "not_configured" };
  }
  if (!to || typeof to !== "string" || !to.trim()) {
    return { sent: false, reason: "no_email" };
  }

  const ref = order.paymentRef || String(order._id);
  const safeName = recipientName ? escapeHtml(recipientName) : "";
  const subject = `Model Shop — Đơn hàng đã hủy (${ref})`;
  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b;background:#f8fafc;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(15,23,42,.08);overflow:hidden;">
    <tr><td style="padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:16px;">Xin chào${safeName ? ` <strong>${safeName}</strong>` : ""},</p>
      <p style="margin:0 0 16px;">Đơn hàng <strong>${escapeHtml(ref)}</strong> đã được <strong style="color:#b91c1c;">hủy</strong>. Sản phẩm trong đơn được hoàn lại kho nếu đơn chưa giao.</p>
      ${orderSummaryBlock(order, ref)}
      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Nếu bạn không yêu cầu hủy, hãy liên hệ shop ngay để được hỗ trợ.</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Xin chào${recipientName ? ` ${recipientName}` : ""},`,
    "",
    `Đơn ${ref} đã hủy.`,
    `Tổng: ${formatVnd(order.totalPrice)}`,
    ""
  ].join("\n");

  try {
    await cfg.transporter.sendMail({ from: cfg.from, to: to.trim(), subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error("[mail] Gửi email hủy đơn thất bại:", err);
    return { sent: false, reason: "send_failed" };
  }
}
