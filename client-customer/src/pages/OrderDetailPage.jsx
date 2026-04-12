import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { api } from "../services/api.js";
import { resolvePublicUrl } from "../utils/publicUrl.js";
import { ORDER_STATUS_LABELS, getStatusClass } from "../lib/orderStatus.js";

const PAYMENT_LABELS = {
  cod: "COD",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  zalopay: "ZaloPay"
};
const PAYMENT_STATUS_LABELS = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán" };

export default function OrderDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofBusy, setProofBusy] = useState(false);
  /** SĐT dùng để tra cứu đơn khách (khởi tạo từ session sau checkout) */
  const [guestLookupPhone, setGuestLookupPhone] = useState(
    () => sessionStorage.getItem("checkoutPhone") || ""
  );
  const [guestPhoneInput, setGuestPhoneInput] = useState(
    () => sessionStorage.getItem("checkoutPhone") || ""
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        if (!guestLookupPhone.trim()) {
          setOrder(null);
          return;
        }
      }
      setLoading(true);
      try {
        if (token) {
          const res = await api.get(`/orders/my`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (cancelled) return;
          const found = res.data.find((o) => o._id === id);
          setOrder(found || null);
        } else {
          const res = await api.get(
            `/orders/guest/${id}?phone=${encodeURIComponent(guestLookupPhone.trim())}`
          );
          if (cancelled) return;
          setOrder(res.data);
        }
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, id, guestLookupPhone]);

  useEffect(() => {
    if (!order || order.paymentMethod === "cod" || order.paymentStatus === "paid" || order.status === "cancelled") return;
    api.get("/payment-config").then((res) => setPaymentConfig(res.data)).catch(() => setPaymentConfig(null));
  }, [order]);

  const guestLookupForm = !token && !guestLookupPhone.trim();

  if (guestLookupForm) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-rose-600 dark:hover:text-cyan-400">Trang chủ</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700 dark:text-slate-200">Tra cứu đơn</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Xem đơn không đăng nhập</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Nhập số điện thoại bạn đã dùng khi đặt hàng để xem chi tiết đơn.
        </p>
        <div className="flex flex-col gap-2">
          <input
            type="tel"
            value={guestPhoneInput}
            onChange={(e) => setGuestPhoneInput(e.target.value)}
            placeholder="Số điện thoại"
            className="rounded-xl border border-rose-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={!guestPhoneInput.trim()}
            onClick={() => setGuestLookupPhone(guestPhoneInput.trim())}
            className="rounded-xl bg-rose-600 dark:bg-cyan-600 text-white py-2 font-semibold disabled:opacity-50"
          >
            Xem đơn hàng
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-rose-600 dark:text-cyan-400 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải...</p>;
  if (!order) {
    return (
      <div className="text-center py-12 max-w-md mx-auto space-y-3">
        <p className="text-slate-600 dark:text-slate-400">Không tìm thấy đơn hàng hoặc SĐT không khớp.</p>
        {!token && (
          <button
            type="button"
            className="text-sm text-rose-600 dark:text-cyan-400 hover:underline"
            onClick={() => {
              setGuestLookupPhone("");
              setGuestPhoneInput("");
            }}
          >
            Thử số điện thoại khác
          </button>
        )}
        <div>
          <Link
            to={token ? "/orders" : "/"}
            className="text-rose-600 dark:text-cyan-400 hover:underline inline-block"
          >
            {token ? "← Quay lại đơn hàng" : "← Về trang chủ"}
          </Link>
        </div>
      </div>
    );
  }

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
      : "rounded-2xl border border-rose-200 bg-white p-4 sm:p-5 shadow-sm";

  const paymentContent = `MS-${order._id.slice(-8)}`;
  const copyTransferContent = () => {
    const text =
      order.paymentMethod === "bank_transfer" && paymentConfig
        ? `Số tiền: ${order.totalPrice.toLocaleString("vi-VN")} VND\nNội dung: ${paymentContent}\nNgân hàng: ${paymentConfig.bankName || ""}\nSTK: ${paymentConfig.bankAccount || ""}\nChủ TK: ${paymentConfig.accountHolder || ""}`
        : `Số tiền: ${order.totalPrice.toLocaleString("vi-VN")} VND\nNội dung: ${paymentContent}`;
    navigator.clipboard.writeText(text).then(() => setMsg("Đã sao chép nội dung chuyển khoản."));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-rose-600 dark:hover:text-cyan-400">Trang chủ</Link>
        <span className="mx-2">/</span>
        {token ? (
          <Link to="/orders" className="hover:text-rose-600 dark:hover:text-cyan-400">Đơn hàng</Link>
        ) : (
          <span className="text-slate-600 dark:text-slate-500">Đơn khách</span>
        )}
        <span className="mx-2">/</span>
        <span className="text-slate-700 dark:text-slate-200">Chi tiết</span>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Chi tiết đơn hàng
      </h2>

      {msg && (
        <div className="text-sm rounded-xl px-3 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          {msg}
        </div>
      )}

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mã đơn: <span className="font-mono text-slate-700 dark:text-slate-200">{order._id}</span>
          </span>
          <span className={getStatusClass(order.status, theme)}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        {order.status === "pending" && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("Bạn muốn hủy đơn hàng này?")) return;
                setBusy(true);
                setMsg("");
                try {
                  const res = await api.post(
                    `/orders/${order._id}/cancel`,
                    token ? {} : { phone: order.phone.trim() }
                  );
                  setOrder(res.data);
                  setMsg("Đã hủy đơn hàng.");
                } catch (e) {
                  console.error(e);
                  alert(e.response?.data?.message || "Không thể hủy đơn.");
                } finally {
                  setBusy(false);
                }
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition disabled:opacity-50"
            >
              {busy ? "Đang hủy..." : "Hủy đơn hàng"}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bạn chỉ có thể hủy khi đơn đang ở trạng thái <span className="font-semibold">Chờ xử lý</span>.
            </p>
          </div>
        )}

        <div className="space-y-2 text-sm border-t border-rose-200 dark:border-slate-700 pt-4">
          {order.recipientName && (
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Người nhận:</span>{" "}
              {order.recipientName}
            </p>
          )}
          {order.guestEmail && (
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Email:</span>{" "}
              {order.guestEmail}
            </p>
          )}
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Hình thức nhận hàng:</span>{" "}
            {order.deliveryType === "pickup" ? "Nhận tại cửa hàng" : "Giao tận nơi"}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {order.deliveryType === "pickup" ? "Địa điểm / ghi chú:" : "Địa chỉ giao hàng:"}
            </span>{" "}
            {order.address}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Số điện thoại:</span>{" "}
            {order.phone}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Thanh toán:</span>{" "}
            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "COD"} •{" "}
            <span className="text-slate-500">{PAYMENT_STATUS_LABELS[order.paymentStatus] || "Chưa thanh toán"}</span>
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Đặt lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        {order.paymentMethod !== "cod" && order.paymentStatus !== "paid" && order.status !== "cancelled" && (
          <div className="border-t border-rose-200 dark:border-slate-700 pt-4 mt-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Hướng dẫn thanh toán
            </p>
            {order.paymentMethod === "bank_transfer" && (
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                {paymentConfig &&
                (paymentConfig.bankName ||
                  paymentConfig.bankAccount ||
                  paymentConfig.accountHolder ||
                  paymentConfig.qrImageUrl) ? (
                  <>
                    {paymentConfig.bankName && (
                      <p><span className="font-medium text-slate-700 dark:text-slate-200">Ngân hàng:</span> {paymentConfig.bankName}</p>
                    )}
                    {paymentConfig.bankAccount && (
                      <p><span className="font-medium text-slate-700 dark:text-slate-200">Số tài khoản:</span> {paymentConfig.bankAccount}</p>
                    )}
                    {paymentConfig.accountHolder && (
                      <p><span className="font-medium text-slate-700 dark:text-slate-200">Chủ tài khoản:</span> {paymentConfig.accountHolder}</p>
                    )}
                    {paymentConfig.qrImageUrl && (
                      <div className="mt-3">
                        <p className="font-medium text-slate-700 dark:text-slate-200 mb-2">Quét mã QR chuyển khoản</p>
                        <div className="rounded-xl border border-slate-600 bg-slate-900/30 p-2 inline-block max-w-full">
                          <img
                            src={resolvePublicUrl(paymentConfig.qrImageUrl)}
                            alt="QR chuyển khoản"
                            className="max-w-[min(280px,100%)] w-auto max-h-72 h-auto object-contain mx-auto block"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">Admin chưa cấu hình thông tin chuyển khoản. Vui lòng liên hệ cửa hàng.</p>
                )}
                <p>
                  - <span className="font-medium text-slate-700 dark:text-slate-200">Số tiền:</span>{" "}
                  <span className="font-semibold">{order.totalPrice.toLocaleString("vi-VN")} ₫</span>
                </p>
                <p>
                  - <span className="font-medium text-slate-700 dark:text-slate-200">Nội dung chuyển khoản:</span>{" "}
                  <span className="font-mono">{paymentContent}</span>
                </p>
                <button
                  type="button"
                  onClick={copyTransferContent}
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                >
                  Sao chép nội dung chuyển khoản
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Sau khi chuyển khoản, admin sẽ xác nhận “Đã thanh toán”.
                </p>
              </div>
            )}
            {(order.paymentMethod === "momo" || order.paymentMethod === "zalopay") && (
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <p>
                  - Mở app <span className="font-semibold">{order.paymentMethod === "momo" ? "MoMo" : "ZaloPay"}</span> và chuyển tiền đến:
                </p>
                <p>
                  - <span className="font-medium text-slate-700 dark:text-slate-200">SĐT nhận:</span>{" "}
                  {(order.paymentMethod === "momo" ? paymentConfig?.momoPhone : paymentConfig?.zalopayPhone) || "Chưa cấu hình"}
                </p>
                <p>
                  - <span className="font-medium text-slate-700 dark:text-slate-200">Số tiền:</span>{" "}
                  <span className="font-semibold">{order.totalPrice.toLocaleString("vi-VN")} ₫</span>
                </p>
                <p>
                  - <span className="font-medium text-slate-700 dark:text-slate-200">Nội dung:</span>{" "}
                  <span className="font-mono">{paymentContent}</span>
                </p>
                <button
                  type="button"
                  onClick={copyTransferContent}
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                >
                  Sao chép nội dung
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Admin sẽ xác nhận khi nhận được tiền.
                </p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-rose-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Gửi ảnh minh chứng thanh toán
              </p>
              {order.paymentProofUrl ? (
                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                  <p>
                    Đã gửi lúc:{" "}
                    <span className="text-slate-500">
                      {order.paymentProofSubmittedAt ? new Date(order.paymentProofSubmittedAt).toLocaleString("vi-VN") : "-"}
                    </span>
                  </p>
                  <img
                    src={resolvePublicUrl(order.paymentProofUrl)}
                    alt="Minh chứng thanh toán"
                    className="max-w-full w-full max-h-80 h-auto object-contain rounded-xl border border-slate-600 bg-slate-900/30"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Admin sẽ kiểm tra và xác nhận “Đã thanh toán”.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="text-sm text-slate-600 dark:text-slate-300"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    disabled={!proofFile || proofBusy}
                    onClick={async () => {
                      if (!proofFile) return;
                      setProofBusy(true);
                      setMsg("");
                      try {
                        const data = new FormData();
                        data.append("image", proofFile);
                        const up = await api.post("/uploads/payment-proof", data);
                        const res = await api.post(`/orders/${order._id}/payment-proof`, {
                          url: up.data.url,
                          ...(token ? {} : { phone: order.phone.trim() })
                        });
                        setOrder(res.data);
                        setProofFile(null);
                        setMsg("Đã gửi ảnh minh chứng. Chờ admin xác nhận.");
                      } catch (e) {
                        console.error(e);
                        alert(e.response?.data?.message || "Không gửi được minh chứng.");
                      } finally {
                        setProofBusy(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 transition disabled:opacity-50"
                  >
                    {proofBusy ? "Đang gửi..." : "Gửi minh chứng"}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Hỗ trợ ảnh png/jpg/webp (tối đa 5MB).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(order.subtotal != null ||
          order.shippingFee != null ||
          Number(order.discountAmount) > 0) && (
          <div className="border-t border-rose-200 dark:border-slate-700 pt-4 mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {order.subtotal != null && (
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{order.subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>
            )}
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Giảm giá{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>−{order.discountAmount.toLocaleString("vi-VN")} ₫</span>
              </div>
            )}
            {order.shippingFee != null && (
              <div className="flex justify-between">
                <span>Phí giao hàng</span>
                <span>
                  {order.shippingFee === 0 ? "Miễn phí" : `${order.shippingFee.toLocaleString("vi-VN")} ₫`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-rose-200 dark:border-slate-700 pt-4 mt-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Sản phẩm</p>
          <ul className="space-y-2">
            {order.items.map((i, idx) => (
              <li
                key={`${order._id}-${idx}-${i.product?._id ?? "line"}`}
                className="flex justify-between text-sm text-slate-600 dark:text-slate-300"
              >
                <span>
                  {i.product?.name || "Sản phẩm"} × {i.quantity}
                </span>
                <span>{(i.price * i.quantity).toLocaleString("vi-VN")} ₫</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100 mt-3 pt-3 border-t border-rose-200 dark:border-slate-700">
            <span>Tổng cộng</span>
            <span className="text-rose-600 dark:text-cyan-400">
              {order.totalPrice.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>
      </div>

      <Link
        to={token ? "/orders" : "/"}
        className={
          "inline-block px-4 py-2 rounded-xl text-sm font-medium " +
          (theme === "dark"
            ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
            : "bg-rose-100 text-rose-700 hover:bg-rose-200")
        }
      >
        {token ? "← Quay lại danh sách đơn hàng" : "← Về trang chủ"}
      </Link>
    </div>
  );
}
