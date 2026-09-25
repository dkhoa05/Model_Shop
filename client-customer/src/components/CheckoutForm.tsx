"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { saveGuestOrderToken } from "@/lib/guestOrders";
import { formatVND } from "@/utils/currency";
import Button from "./Button";

const initialValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  note: "",
  deliveryType: "delivery",
  paymentMethod: "cod"
};

interface ApiOrder {
  _id: string;
  accessToken?: string;
  [key: string]: unknown;
}

interface CouponPreview {
  discount: number;
  normalizedCode: string;
  error: string | null;
}

export default function CheckoutForm({ onSummaryChange }: { onSummaryChange?: (s: { deliveryType: string; discount: number }) => void }) {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [values, setValues] = useState({
    ...initialValues,
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [enabledMethods, setEnabledMethods] = useState<string[]>(["cod"]);
  const { shippingConfig } = useCart();

  useEffect(() => {
    onSummaryChange?.({ deliveryType: values.deliveryType, discount: couponDiscount });
  }, [values.deliveryType, couponDiscount, onSummaryChange]);

  useEffect(() => {
    apiFetch<{ enabledMethods?: string[] }>("/payment-config")
      .then((cfg) => setEnabledMethods(cfg.enabledMethods?.length ? cfg.enabledMethods : ["cod"]))
      .catch(() => setEnabledMethods(["cod"]));
  }, []);

  useEffect(() => {
    if (user) {
      setValues((current) => ({
        ...current,
        name: user.name || current.name,
        phone: user.phone || current.phone,
        email: user.email || current.email,
        address: user.address || current.address
      }));
    }
  }, [user]);

  const update = (field: keyof typeof initialValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const applyCoupon = async () => {
    setCouponMessage("");
    setCouponDiscount(0);

    if (!couponCode.trim()) {
      setCouponMessage("Nhập mã giảm giá trước khi áp dụng.");
      return;
    }

    if (!user) {
      setCouponMessage("Vui lòng đăng nhập để dùng mã giảm giá.");
      return;
    }

    try {
      const preview = await apiFetch<CouponPreview>("/coupons/preview", {
        method: "POST",
        body: JSON.stringify({
          code: couponCode,
          lines: cartItems.map((item) => ({
            product: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          }))
        })
      });

      if (preview.error) {
        setCouponMessage(preview.error);
        return;
      }

      setCouponCode(preview.normalizedCode || couponCode);
      setCouponDiscount(preview.discount || 0);
      setCouponMessage(preview.discount > 0 ? `Đã áp dụng giảm ${formatVND(preview.discount)}.` : "Mã hợp lệ nhưng chưa giảm cho đơn này.");
    } catch (err) {
      setCouponMessage(err instanceof Error ? err.message : "Không áp dụng được mã.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) nextErrors.name = "Vui lòng nhập họ tên.";
    if (!/^0\d{9}$/.test(values.phone.trim())) nextErrors.phone = "Số điện thoại cần có 10 chữ số và bắt đầu bằng 0.";
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) nextErrors.email = "Email chưa hợp lệ.";
    if (values.deliveryType === "delivery" && values.address.trim().length < 10) nextErrors.address = "Vui lòng nhập địa chỉ giao hàng chi tiết hơn.";
    if (cartItems.length === 0) nextErrors.cart = "Giỏ hàng đang trống.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      if (user) {
        await updateProfile({
          name: values.name,
          phone: values.phone,
          email: values.email,
          address: values.address
        });
      }

      const order = await apiFetch<ApiOrder>("/orders", {
        method: "POST",
        body: JSON.stringify({
          recipientName: values.name,
          guestEmail: values.email,
          phone: values.phone,
          address: values.address,
          addressDetail: values.address,
          note: values.note,
          deliveryType: values.deliveryType,
          paymentMethod: values.paymentMethod,
          couponCode: couponCode.trim(),
          items: cartItems.map((item) => ({
            product: item.product.id,
            quantity: item.quantity
          }))
        })
      });

      // Khách vãng lai: giữ token của riêng đơn này để xem/hủy đơn (server chỉ trả token một lần)
      if (order.accessToken) saveGuestOrderToken(order._id, order.accessToken);
      clearCart();
      router.push(`/orders/${order._id}`);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Không tạo được đơn hàng." });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {!user && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-50">
          Đăng nhập hoặc đăng ký để lưu thông tin giao hàng, dùng mã giảm giá và checkout nhanh hơn.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Đăng nhập</Link>
            <Link href="/register" className="rounded-xl border border-cyan-300/40 px-3 py-2 text-xs font-black uppercase text-cyan-100 hover:bg-cyan-300 hover:text-zinc-950">Đăng ký</Link>
          </div>
        </div>
      )}
      {errors.cart && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">{errors.cart}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ tên" error={errors.name}><input value={values.name} onChange={(event) => update("name", event.target.value)} className="input" placeholder="Nguyễn Văn A" /></Field>
        <Field label="Số điện thoại" error={errors.phone}><input value={values.phone} onChange={(event) => update("phone", event.target.value)} className="input" placeholder="0900000000" /></Field>
      </div>
      <Field label="Email" error={errors.email}><input value={values.email} onChange={(event) => update("email", event.target.value)} className="input" placeholder="you@example.com" type="email" /></Field>
      {values.deliveryType === "delivery" && <Field label="Địa chỉ" error={errors.address}><textarea value={values.address} onChange={(event) => update("address", event.target.value)} className="input min-h-24 py-3" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" /></Field>}
      <Field label="Ghi chú"><textarea value={values.note} onChange={(event) => update("note", event.target.value)} className="input min-h-20 py-3" placeholder="Thời gian nhận hàng, lưu ý đóng gói..." /></Field>

      <section className="grid gap-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">Hình thức nhận hàng</h2>
        <Radio label="Giao tận nơi" desc={`Phí ${formatVND(shippingConfig.shippingFlatFee)}, miễn phí cho đơn từ ${formatVND(shippingConfig.freeShippingThreshold)}`} name="delivery" checked={values.deliveryType === "delivery"} onChange={() => update("deliveryType", "delivery")} />
        <Radio label="Nhận tại cửa hàng" desc={shippingConfig.pickupAddress || "Nhận trực tiếp tại cửa hàng, không mất phí giao hàng"} name="delivery" checked={values.deliveryType === "pickup"} onChange={() => update("deliveryType", "pickup")} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">Payment method</h2>
        <Radio label="COD" desc="Thanh toán khi nhận hàng" name="payment" checked={values.paymentMethod === "cod"} onChange={() => update("paymentMethod", "cod")} />
        {enabledMethods.includes("bank_transfer") && (
          <Radio label="Chuyển khoản ngân hàng" desc="Sau khi đặt hàng, chuyển khoản và tải ảnh minh chứng để shop xác nhận" name="payment" checked={values.paymentMethod === "bank_transfer"} onChange={() => update("paymentMethod", "bank_transfer")} />
        )}
        {enabledMethods.includes("momo") && (
          <Radio label="Ví MoMo" desc="Chuyển tiền tới ví MoMo của shop và tải ảnh minh chứng" name="payment" checked={values.paymentMethod === "momo"} onChange={() => update("paymentMethod", "momo")} />
        )}
        {enabledMethods.includes("zalopay") && (
          <Radio label="ZaloPay" desc="Chuyển tiền tới ví ZaloPay của shop và tải ảnh minh chứng" name="payment" checked={values.paymentMethod === "zalopay"} onChange={() => update("paymentMethod", "zalopay")} />
        )}
      </section>

      <section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">Mã giảm giá</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="input" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="VD: GUNDAM10" />
          <button type="button" onClick={applyCoupon} className="rounded-xl border border-cyan-400/40 px-4 py-2 text-xs font-black uppercase text-cyan-200 hover:bg-cyan-400 hover:text-zinc-950">
            Áp dụng
          </button>
        </div>
        {couponMessage && <p className="text-sm text-zinc-300">{couponMessage}</p>}
        {couponDiscount > 0 && <p className="text-sm font-black text-emerald-300">Tạm giảm: {formatVND(couponDiscount)}</p>}
      </section>

      {errors.submit && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">{errors.submit}</div>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang tạo đơn..." : "Place order"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-zinc-300">
      {label}
      {children}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  );
}

function Radio({ label, desc, ...props }: { label: string; desc: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
      <input type="radio" className="mt-1 accent-red-600" {...props} />
      <span>
        <span className="block font-black text-white">{label}</span>
        <span className="mt-1 block text-zinc-400">{desc}</span>
      </span>
    </label>
  );
}
