"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { formatVND } from "@/utils/currency";
import { Notice } from "./form";

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
      setError("Chỉ nhận ảnh JPG, PNG hoặc WEBP, tối đa 5MB.");
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append("image", file);
      const uploaded = await apiFetch<{ url: string }>("/uploads/payment-proof", { method: "POST", body: data });
      await apiFetch(`/orders/${orderId}/payment-proof`, { method: "POST", body: JSON.stringify({ url: uploaded.url, token: guestToken }) });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được minh chứng.");
    } finally {
      setUploading(false);
    }
  };

  const target =
    paymentMethod === "bank_transfer"
      ? `${config?.bankName || "Ngân hàng"}, số tài khoản ${config?.bankAccount || "..."}${config?.accountHolder ? `, chủ tài khoản ${config.accountHolder}` : ""}`
      : paymentMethod === "momo"
        ? `ví MoMo ${config?.momoPhone || "..."}`
        : `ví ZaloPay ${config?.zalopayPhone || "..."}`;
  const qr = config?.qrImageUrl ? (config.qrImageUrl.startsWith("/uploads") ? `${API_BASE_URL}${config.qrImageUrl}` : config.qrImageUrl) : "";

  return (
    <section aria-labelledby="pay-title" className="rounded-[24px] border-2 border-accent/60 bg-accent/5 p-6">
      <h2 id="pay-title" className="text-xl font-extrabold text-fg">
        Hoàn tất thanh toán
      </h2>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex-1 text-[15px] leading-7 text-zinc-200">
          <p>
            Chuyển <strong className="text-fg">{formatVND(total)}</strong> tới <strong className="text-fg">{target}</strong>.
          </p>
          <p className="mt-2">
            Nội dung chuyển khoản: <strong className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-accent-text">{paymentRef}</strong>
          </p>
          <p className="mt-2 text-zinc-400">Sau khi chuyển, tải ảnh chụp minh chứng để shop xác nhận và xử lý đơn.</p>
        </div>
        {qr && <img src={qr} alt="Mã QR chuyển khoản" className="h-40 w-40 shrink-0 rounded-2xl bg-white object-contain p-2" />}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-accent px-5 text-[15px] font-bold text-on-accent transition hover:brightness-110 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
          <Upload size={18} aria-hidden />
          {uploading ? "Đang tải..." : proofUrl ? "Gửi lại minh chứng" : "Tải ảnh minh chứng"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFile} disabled={uploading} />
        </label>
        {proofUrl && (
          <a href={proofUrl.startsWith("/uploads") ? `${API_BASE_URL}${proofUrl}` : proofUrl} target="_blank" rel="noreferrer" className="link text-sm">
            Xem minh chứng đã gửi (đang chờ shop xác nhận)
          </a>
        )}
      </div>
      {error && (
        <div className="mt-4">
          <Notice type="error">{error}</Notice>
        </div>
      )}
    </section>
  );
}
