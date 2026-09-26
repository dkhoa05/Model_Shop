"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { saveGuestOrderToken } from "@/lib/guestOrders";
import { formatVND } from "@/utils/currency";
import Button from "./Button";
import { Field, Notice, RadioCard } from "./form";

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

const PAYMENT_LABELS: Record<string, { label: string; desc: string }> = {
  cod: { label: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt cho nhân viên giao hàng." },
  bank_transfer: { label: "Chuyển khoản ngân hàng", desc: "Sau khi đặt hàng, chuyển khoản và tải ảnh minh chứng để shop xác nhận." },
  momo: { label: "Ví MoMo", desc: "Chuyển tiền tới ví MoMo của shop và tải ảnh minh chứng." },
  zalopay: { label: "ZaloPay", desc: "Chuyển tiền tới ví ZaloPay của shop và tải ảnh minh chứng." }
};

export default function CheckoutForm({ onSummaryChange }: { onSummaryChange?: (s: { deliveryType: string; discount: number }) => void }) {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { cartItems, clearCart, shippingConfig } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
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
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<string[]>(["cod"]);

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
    setCouponMessage(null);
    setCouponDiscount(0);

    if (!couponCode.trim()) {
      setCouponMessage({ type: "error", text: "Nhập mã giảm giá trước khi áp dụng." });
      return;
    }
    if (!user) {
      setCouponMessage({ type: "error", text: "Vui lòng đăng nhập để dùng mã giảm giá." });
      return;
    }

    setCouponBusy(true);
    try {
      const preview = await apiFetch<CouponPreview>("/coupons/preview", {
        method: "POST",
        body: JSON.stringify({
          code: couponCode,
          lines: cartItems.map((item) => ({ product: item.product.id, quantity: item.quantity, price: item.product.price }))
        })
      });

      if (preview.error) {
        setCouponMessage({ type: "error", text: preview.error });
        return;
      }
      setCouponCode(preview.normalizedCode || couponCode);
      setCouponDiscount(preview.discount || 0);
      setCouponMessage(
        preview.discount > 0
          ? { type: "success", text: `Đã áp dụng, giảm ${formatVND(preview.discount)}.` }
          : { type: "error", text: "Mã hợp lệ nhưng chưa giảm cho đơn này." }
      );
    } catch (err) {
      setCouponMessage({ type: "error", text: err instanceof Error ? err.message : "Không áp dụng được mã." });
    } finally {
      setCouponBusy(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) nextErrors.name = "Vui lòng nhập họ tên.";
    if (!/^0\d{9}$/.test(values.phone.trim())) nextErrors.phone = "Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.";
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) nextErrors.email = "Email chưa hợp lệ, ví dụ ten@example.com.";
    if (values.deliveryType === "delivery" && values.address.trim().length < 10) nextErrors.address = "Vui lòng nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành).";
    if (cartItems.length === 0) nextErrors.cart = "Giỏ hàng đang trống.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Chuyển focus tới trường lỗi đầu tiên để người dùng bàn phím/đọc màn hình sửa ngay
      window.setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setIsSubmitting(true);

    try {
      if (user) {
        await updateProfile({ name: values.name, phone: values.phone, email: values.email, address: values.address });
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
          items: cartItems.map((item) => ({ product: item.product.id, quantity: item.quantity }))
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

  const errorList = Object.entries(errors).filter(([, v]) => v);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-8" noValidate>
      {!user && (
        <Notice type="info">
          <p>
            <Link href="/login" className="link">
              Đăng nhập
            </Link>{" "}
            hoặc{" "}
            <Link href="/register" className="link">
              tạo tài khoản
            </Link>{" "}
            để lưu địa chỉ, theo dõi đơn và dùng mã giảm giá. Bạn vẫn có thể đặt hàng không cần tài khoản.
          </p>
        </Notice>
      )}

      {errorList.length > 0 && (
        <Notice type="error">
          <p className="font-semibold">Vui lòng kiểm tra lại {errorList.length} mục:</p>
          <ul className="mt-1 list-disc pl-5">
            {errorList.map(([key, text]) => (
              <li key={key}>{text}</li>
            ))}
          </ul>
        </Notice>
      )}

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-lg font-extrabold text-fg">Thông tin liên hệ</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ tên" required error={errors.name}>
            <input value={values.name} onChange={(e) => update("name", e.target.value)} className="input" autoComplete="name" />
          </Field>
          <Field label="Số điện thoại" required error={errors.phone} hint="10 chữ số, bắt đầu bằng 0">
            <input value={values.phone} onChange={(e) => update("phone", e.target.value)} className="input" type="tel" inputMode="numeric" autoComplete="tel" />
          </Field>
        </div>
        <Field label="Email" required error={errors.email} hint="Nhận xác nhận đơn hàng và đường dẫn theo dõi đơn">
          <input value={values.email} onChange={(e) => update("email", e.target.value)} className="input" type="email" autoComplete="email" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-lg font-extrabold text-fg">Hình thức nhận hàng</legend>
        <RadioCard
          name="delivery"
          value="delivery"
          checked={values.deliveryType === "delivery"}
          onChange={() => update("deliveryType", "delivery")}
          label="Giao tận nơi"
          desc={`Phí ${formatVND(shippingConfig.shippingFlatFee)}, miễn phí cho đơn từ ${formatVND(shippingConfig.freeShippingThreshold)}`}
        />
        <RadioCard
          name="delivery"
          value="pickup"
          checked={values.deliveryType === "pickup"}
          onChange={() => update("deliveryType", "pickup")}
          label="Nhận tại cửa hàng"
          desc={shippingConfig.pickupAddress || "Nhận trực tiếp tại cửa hàng, không mất phí giao hàng"}
        />
        {values.deliveryType === "delivery" && (
          <Field label="Địa chỉ giao hàng" required error={errors.address} className="mt-2">
            <textarea value={values.address} onChange={(e) => update("address", e.target.value)} className="input min-h-24" autoComplete="street-address" />
          </Field>
        )}
        <Field label="Ghi chú cho đơn hàng" hint="Không bắt buộc. Ví dụ: thời gian nhận hàng, lưu ý đóng gói">
          <textarea value={values.note} onChange={(e) => update("note", e.target.value)} className="input min-h-20" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-lg font-extrabold text-fg">Phương thức thanh toán</legend>
        {enabledMethods.map((method) => (
          <RadioCard
            key={method}
            name="payment"
            value={method}
            checked={values.paymentMethod === method}
            onChange={() => update("paymentMethod", method)}
            label={PAYMENT_LABELS[method]?.label || method}
            desc={PAYMENT_LABELS[method]?.desc}
          />
        ))}
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-lg font-extrabold text-fg">Mã giảm giá</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Nhập mã" className="flex-1">
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="input" autoComplete="off" spellCheck={false} />
          </Field>
          <Button type="button" variant="secondary" onClick={applyCoupon} loading={couponBusy}>
            Áp dụng
          </Button>
        </div>
        {couponMessage && <Notice type={couponMessage.type}>{couponMessage.text}</Notice>}
      </fieldset>

      {errors.submit && <Notice type="error">{errors.submit}</Notice>}

      <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto sm:min-w-64">
        {isSubmitting ? "Đang tạo đơn..." : "Đặt hàng"}
      </Button>
    </form>
  );
}
