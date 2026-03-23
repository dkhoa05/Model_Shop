import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { api } from "../services/api.js";
import {
  SHIPPING_FLAT_FEE,
  FREE_SHIPPING_THRESHOLD,
  COUPON_HINTS,
  previewCouponDiscount
} from "../lib/checkoutConstants.js";
import {
  PROVINCES,
  DISTRICTS_BY_PROVINCE,
  WARDS_BY_DISTRICT
} from "../data/vnAddressHierarchy.js";
import { normalizeCartProductId } from "../lib/cartProductId.js";

const STEPS = [
  { id: 1, label: "Thông tin nhận mô hình" },
  { id: 2, label: "Giao hàng / nhận tại shop" },
  { id: 3, label: "Thanh toán đơn hàng" },
  { id: 4, label: "Xác nhận đặt hàng" }
];

export default function CheckoutPage() {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("cart") || "[]";
    setItems(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (user?.name) setRecipientName(user.name);
    if (user?.phone) setPhone(user.phone);
    if (user?.email) setGuestEmail(user.email);
    if (user?.defaultPaymentMethod) setPaymentMethod(user.defaultPaymentMethod);
  }, [user]);

  const districtOptions = useMemo(
    () => (province ? DISTRICTS_BY_PROVINCE[province] || [] : []),
    [province]
  );
  const wardOptions = useMemo(() => (district ? WARDS_BY_DISTRICT[district] || [] : []), [district]);

  useEffect(() => {
    setDistrict("");
    setWard("");
  }, [province]);

  useEffect(() => {
    setWard("");
  }, [district]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const discountPreview = useMemo(
    () => previewCouponDiscount(couponCode, subtotal),
    [couponCode, subtotal]
  );

  const shippingFee = useMemo(() => {
    if (deliveryType === "pickup") return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
  }, [deliveryType, subtotal]);

  const totalPreview = Math.max(0, subtotal - discountPreview + shippingFee);

  const combinedAddress = useMemo(() => {
    const parts = [addressDetail.trim(), ward, district, province].filter(Boolean);
    return parts.join(", ");
  }, [addressDetail, ward, district, province]);

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const summaryClass =
    theme === "dark"
      ? "space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3"
      : "space-y-3 rounded-2xl border border-rose-200 bg-white p-3 shadow-sm";

  const btnPrimary =
    theme === "dark"
      ? "px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition"
      : "px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition";

  const btnGhost =
    theme === "dark"
      ? "px-4 py-2 rounded-xl text-sm border border-slate-600 text-slate-200 hover:border-cyan-400"
      : "px-4 py-2 rounded-xl text-sm border border-rose-300 text-slate-700 hover:border-rose-500";

  if (!items.length) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-600 dark:text-slate-300">Giỏ hàng trống — không thể thanh toán.</p>
        <Link to="/products" className={btnPrimary + " inline-block"}>
          Xem danh mục mô hình
        </Link>
      </div>
    );
  }

  const emailOk =
    !guestEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim());
  const canNextFrom1 =
    recipientName.trim().length >= 2 && phone.trim().length >= 8 && emailOk;

  const canNextFrom2 =
    deliveryType === "pickup" ||
    (deliveryType === "delivery" &&
      province &&
      district &&
      ward &&
      addressDetail.trim().length >= 3);

  const placeOrder = async () => {
    setMessage("");
    setSubmitting(true);
    try {
      const payloadItems = items.map((i) => ({
        product: normalizeCartProductId(i),
        quantity: i.quantity
      }));
      const missingId = payloadItems.find((row) => !row.product);
      if (missingId) {
        setMessage(
          "Giỏ hàng có dòng thiếu mã sản phẩm. Vui lòng xóa giỏ, tải lại trang và thêm mô hình từ danh mục."
        );
        return;
      }
      try {
        await Promise.all(
          payloadItems.map((row) => api.get(`/products/${encodeURIComponent(row.product)}`))
        );
      } catch {
        setMessage(
          "Một hoặc nhiều mô hình trong giỏ không còn trên hệ thống (thường gặp sau khi cập nhật dữ liệu). Vui lòng xóa giỏ hàng và thêm lại từ trang Sản phẩm."
        );
        return;
      }
      const body = {
        items: payloadItems,
        phone: phone.trim(),
        recipientName: recipientName.trim(),
        guestEmail: guestEmail.trim(),
        deliveryType,
        couponCode: couponCode.trim(),
        paymentMethod,
        addressProvince: deliveryType === "delivery" ? province : "",
        addressDistrict: deliveryType === "delivery" ? district : "",
        addressWard: deliveryType === "delivery" ? ward : "",
        addressDetail: deliveryType === "delivery" ? addressDetail.trim() : "",
        address: deliveryType === "delivery" ? combinedAddress : ""
      };
      const res = await api.post(`/orders`, body);
      localStorage.removeItem("cart");
      setItems([]);
      sessionStorage.setItem("checkoutPhone", phone.trim());
      navigate(`/orders/${res.data._id}`, { replace: true, state: { orderPlaced: true } });
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Không tạo được đơn. Thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={
          "rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2 " +
          (theme === "dark" ? "border-slate-700 bg-slate-900/50" : "border-rose-200 bg-rose-50/80")
        }
      >
        <span className="text-slate-600 dark:text-slate-300">
          {token ? (
            <>Bạn đang đăng nhập — thông tin được điền nhanh, hỗ trợ mã khuyến mãi và theo dõi đơn.</>
          ) : (
            <>
              <span className="font-medium text-slate-800 dark:text-slate-100">Bạn đã có tài khoản?</span> Đăng nhập để
              lưu địa chỉ và xem đơn sau này — hoặc tiếp tục đặt hàng <span className="font-medium">không cần đăng nhập</span>.
            </>
          )}
        </span>
        {!token && (
          <Link
            to="/login?redirect=/checkout"
            className={
              "shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold " +
              (theme === "dark" ? "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30" : "bg-rose-600 text-white hover:bg-rose-700")
            }
          >
            Đăng nhập
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={
              "px-3 py-1.5 rounded-full border " +
              (step === s.id
                ? theme === "dark"
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                  : "border-rose-500 bg-rose-50 text-rose-800"
                : step > s.id
                  ? theme === "dark"
                    ? "border-slate-600 text-slate-400"
                    : "border-rose-200 text-slate-500"
                  : theme === "dark"
                    ? "border-slate-700 text-slate-500"
                    : "border-slate-200 text-slate-400")
            }
          >
            {s.id}. {s.label}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-[2fr,1.35fr] gap-6">
        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Thông tin nhận mô hình
              </h2>
              <div className="space-y-1">
                <label className="text-sm text-slate-600 dark:text-slate-300">Họ tên người nhận *</label>
                <input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className={inputClass}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-600 dark:text-slate-300">Số điện thoại *</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="VD: 0901234567"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-600 dark:text-slate-300">Email (tuỳ chọn — nhận cập nhật đơn)</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className={inputClass}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-600 dark:text-slate-300">Mã khuyến mãi (tuỳ chọn)</label>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className={inputClass}
                  placeholder="Nhập mã"
                />
                <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-0.5 mt-1">
                  {COUPON_HINTS.map((h) => (
                    <li key={h.code}>
                      <span className="font-mono font-semibold">{h.code}</span> — {h.desc}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                disabled={!canNextFrom1}
                onClick={() => setStep(2)}
                className={btnPrimary + (!canNextFrom1 ? " opacity-50 cursor-not-allowed" : "")}
              >
                Tiếp: Địa chỉ &amp; giao hàng
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Giao hàng / nhận tại cửa hàng
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <label
                  className={
                    "flex flex-col gap-1 rounded-xl border p-3 cursor-pointer " +
                    (deliveryType === "pickup"
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700")
                  }
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === "pickup"}
                      onChange={() => setDeliveryType("pickup")}
                    />
                    <span className="font-medium text-slate-200">Nhận tại cửa hàng</span>
                  </span>
                  <span className="text-xs text-slate-500 pl-6">Không phí giao — phù hợp nhận figure/kit trực tiếp</span>
                </label>
                <label
                  className={
                    "flex flex-col gap-1 rounded-xl border p-3 cursor-pointer " +
                    (deliveryType === "delivery"
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700")
                  }
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === "delivery"}
                      onChange={() => setDeliveryType("delivery")}
                    />
                    <span className="font-medium text-slate-200">Giao hàng tận nơi</span>
                  </span>
                  <span className="text-xs text-slate-500 pl-6">
                    {subtotal >= FREE_SHIPPING_THRESHOLD
                      ? "Miễn phí vận chuyển (đơn từ " + FREE_SHIPPING_THRESHOLD.toLocaleString("vi-VN") + " ₫)"
                      : `Phí cố định ${SHIPPING_FLAT_FEE.toLocaleString("vi-VN")} ₫ (miễn phí từ ${FREE_SHIPPING_THRESHOLD.toLocaleString("vi-VN")} ₫)`}
                  </span>
                </label>
              </div>
              {deliveryType === "delivery" && (
                <div className="space-y-3 rounded-xl border border-slate-700/80 p-3 bg-slate-900/20">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chọn Tỉnh/Thành phố → Quận/Huyện → Phường/Xã, sau đó nhập số nhà, tên đường (đóng gói mô hình cẩn thận).
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-slate-500">Tỉnh / Thành phố *</label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">— Chọn —</option>
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Quận / Huyện *</label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className={inputClass}
                        disabled={!province}
                      >
                        <option value="">— Chọn —</option>
                        {districtOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Phường / Xã *</label>
                      <select
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className={inputClass}
                        disabled={!district}
                      >
                        <option value="">— Chọn —</option>
                        {wardOptions.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-slate-500">Địa chỉ chi tiết (số nhà, tên đường, ghi chú giao hàng) *</label>
                      <textarea
                        value={addressDetail}
                        onChange={(e) => setAddressDetail(e.target.value)}
                        className={inputClass + " min-h-[72px]"}
                        placeholder="Ví dụ: 123 Nguyễn Huệ, tòa nhà A, lầu 5"
                      />
                    </div>
                  </div>
                </div>
              )}
              {deliveryType === "pickup" && (
                <p className="text-sm text-slate-500 dark:text-slate-400 rounded-xl border border-slate-700/80 p-3 bg-slate-900/30">
                  Bạn sẽ nhận mô hình tại cửa. Địa chỉ cửa hàng sẽ hiển thị trên đơn sau khi đặt.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setStep(1)} className={btnGhost}>
                  ← Quay lại
                </button>
                <button
                  type="button"
                  disabled={!canNextFrom2}
                  onClick={() => setStep(3)}
                  className={btnPrimary + (!canNextFrom2 ? " opacity-50 cursor-not-allowed" : "")}
                >
                  Tiếp: Thanh toán
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Phương thức thanh toán
              </h2>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  { id: "cod", label: "COD — Thanh toán khi nhận hàng" },
                  { id: "bank_transfer", label: "Chuyển khoản ngân hàng" },
                  { id: "momo", label: "Ví MoMo" },
                  { id: "zalopay", label: "ZaloPay" }
                ].map((m) => (
                  <label
                    key={m.id}
                    className={
                      "flex items-start gap-2 rounded-xl border p-3 cursor-pointer " +
                      (paymentMethod === m.id
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700")
                    }
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id)}
                      className="mt-0.5"
                    />
                    <span className="text-slate-200">{m.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Sau khi đặt hàng, bạn có thể gửi ảnh chuyển khoản trong chi tiết đơn (nếu không dùng COD).
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setStep(2)} className={btnGhost}>
                  ← Quay lại
                </button>
                <button type="button" onClick={() => setStep(4)} className={btnPrimary}>
                  Tiếp: Xác nhận
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Xác nhận đặt hàng
              </h2>
              <div
                className={
                  "rounded-xl border p-4 text-sm space-y-2 " +
                  (theme === "dark" ? "border-slate-700 bg-slate-900/40" : "border-rose-200 bg-rose-50/50")
                }
              >
                <p>
                  <span className="text-slate-500">Người nhận:</span>{" "}
                  <span className="font-medium">{recipientName}</span>
                </p>
                <p>
                  <span className="text-slate-500">Điện thoại:</span>{" "}
                  <span className="font-medium">{phone}</span>
                </p>
                {guestEmail.trim() && (
                  <p>
                    <span className="text-slate-500">Email:</span> {guestEmail}
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Nhận hàng:</span>{" "}
                  <span className="font-medium">
                    {deliveryType === "pickup" ? "Tại cửa hàng" : "Giao tận nơi"}
                  </span>
                </p>
                {deliveryType === "delivery" && (
                  <p>
                    <span className="text-slate-500">Địa chỉ:</span> {combinedAddress}
                  </p>
                )}
                <p>
                  <span className="text-slate-500">Thanh toán:</span>{" "}
                  <span className="font-medium">
                    {paymentMethod === "cod"
                      ? "COD"
                      : paymentMethod === "bank_transfer"
                        ? "Chuyển khoản"
                        : paymentMethod === "momo"
                          ? "MoMo"
                          : "ZaloPay"}
                  </span>
                </p>
                {couponCode.trim() && discountPreview > 0 && (
                  <p className="text-emerald-600 dark:text-emerald-400">
                    Mã {couponCode.trim().toUpperCase()} — giảm {discountPreview.toLocaleString("vi-VN")} ₫
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setStep(3)} className={btnGhost}>
                  ← Quay lại
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={placeOrder}
                  className={btnPrimary + (submitting ? " opacity-60" : "")}
                >
                  {submitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
                </button>
              </div>
              {message && <p className="text-sm text-red-500 dark:text-amber-300">{message}</p>}
            </div>
          )}
        </div>

        <div className={summaryClass}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tóm tắt đơn hàng</h3>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {items.map((i) => (
              <div key={i.productId} className="flex items-start justify-between gap-2">
                <span className="truncate">
                  <span className="font-medium">{i.name}</span>
                  {i.variantLabel ? (
                    <span className="block text-xs text-slate-500 dark:text-slate-500 font-normal">
                      {i.variantLabel}
                    </span>
                  ) : null}
                  <span className="block text-xs text-slate-500">× {i.quantity} mô hình</span>
                </span>
                <span className="shrink-0">{(i.price * i.quantity).toLocaleString("vi-VN")} ₫</span>
              </div>
            ))}
          </div>
          <div className={"border-t pt-2 space-y-1 text-sm " + (theme === "dark" ? "border-slate-800" : "border-rose-200")}>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
            </div>
            {discountPreview > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Giảm giá</span>
                <span>−{discountPreview.toLocaleString("vi-VN")} ₫</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Phí giao hàng</span>
              <span>
                {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString("vi-VN")} ₫`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-rose-600 dark:text-cyan-400 pt-1">
              <span>Tổng thanh toán</span>
              <span>{totalPreview.toLocaleString("vi-VN")} ₫</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 pt-2">
            Giá cuối được tính lại trên server khi bạn xác nhận.
          </p>
        </div>
      </div>
    </div>
  );
}
