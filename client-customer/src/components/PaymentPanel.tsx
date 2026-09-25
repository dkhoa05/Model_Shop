"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { formatVND } from "@/utils/currency";

interface PaymentConfig {
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  qrImageUrl?: string;
  momoPhone?: string;
  zalopayPhone?: string;
}

interface Props {
  orderId: string;
  paymentMethod: string;
  paymentRef?: string;
  total: number;
  proofUrl?: string;
  guestToken: string;
  onSubmitted: () => void;
}

/** Hướng dẫn thanh toán + tải ảnh minh chứng cho đơn chuyển khoản/ví điện tử chưa thanh toán */
export default function PaymentPanel({ orderId, paymentMethod, paymentRef, total, proofUrl, guestToken, onSubmitted }: Props) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    apiFetch<PaymentConfig>("/payment-config")
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Chỉ nhận ảnh JPG/PNG/WEBP tối đa 5MB.");
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append("image", file);
      const uploaded = await apiFetch<{ url: string }>("/uploads/payment-proof", { method: "POST", body: data });
      await apiFetch(`/orders/${orderId}/payment-proof`, {
        method: "POST",
        body: JSON.stringify({ url: uploaded.url, token: guestToken })
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được minh chứng.");
    } finally {
      setUploading(false);
    }
  };

  const target =
    paymentMethod === "bank_transfer"
      ? `${config?.bankName || "Ngân hàng"} — STK ${config?.bankAccount || "…"}${config?.accountHolder ? ` (${config.accountHolder})` : ""}`
      : paymentMethod === "momo"
        ? `MoMo: ${config?.momoPhone || "…"}`
        : `ZaloPay: ${config?.zalopayPhone || "…"}`;
  const qr = config?.qrImageUrl ? (config.qrImageUrl.startsWith("/uploads") ? `${API_BASE_URL}${config.qrImageUrl}` : config.qrImageUrl) : "";

  return (
    <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
      <h2 className="font-space-grotesk text-xl font-black uppercase text-white">Thanh toán đơn hàng</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-300">
        Vui lòng chuyển <strong className="text-red-300">{formatVND(total)}</strong> tới <strong>{target}</strong>, nội dung chuyển khoản:{" "}
        <strong className="text-cyan-200">{paymentRef}</strong>. Sau đó tải ảnh minh chứng để shop xác nhận.
      </p>
      {qr && <img src={qr} alt="QR thanh toán" className="mt-3 h-44 w-44 rounded-xl bg-white object-contain p-2" />}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-red-500">
          {uploading ? "Đang tải..." : proofUrl ? "Gửi lại minh chứng" : "Tải ảnh minh chứng"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {proofUrl && (
          <a href={proofUrl.startsWith("/uploads") ? `${API_BASE_URL}${proofUrl}` : proofUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-cyan-300 underline">
            Xem minh chứng đã gửi (chờ shop xác nhận)
          </a>
        )}
      </div>
      {error && <p className="mt-3 text-sm font-bold text-red-300">{error}</p>}
    </section>
  );
}
