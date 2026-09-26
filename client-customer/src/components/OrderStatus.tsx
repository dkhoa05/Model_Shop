import { Check } from "lucide-react";

export const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy"
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán" };

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản",
  momo: "Ví MoMo",
  zalopay: "ZaloPay"
};

const STEPS = ["pending", "processing", "shipped", "delivered"];

/** Nhãn trạng thái: chữ + biểu tượng, không chỉ dựa vào màu */
export function StatusPill({ status }: { status: string }) {
  const done = status === "delivered";
  const cancelled = status === "cancelled";
  const cls = cancelled
    ? "bg-zinc-800 text-zinc-300"
    : done
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-accent/15 text-accent-text";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${cls}`}>{STATUS_LABELS[status] || status}</span>;
}

/** Tiến trình đơn: danh sách có thứ tự, bước hiện tại đánh dấu aria-current="step" */
export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return <p className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-200">Đơn hàng đã được hủy.</p>;
  }
  const current = Math.max(0, STEPS.indexOf(status));
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Tiến trình đơn hàng">
      {STEPS.map((step, i) => {
        const reached = i <= current;
        return (
          <li key={step} aria-current={i === current ? "step" : undefined} className="flex flex-col items-center gap-2 text-center">
            <span className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold ${reached ? "border-accent bg-accent text-on-accent" : "border-zinc-700 text-zinc-500"}`}>
              {reached && i < current ? <Check size={18} strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={`text-xs font-semibold sm:text-sm ${reached ? "text-fg" : "text-zinc-500"}`}>
              {STATUS_LABELS[step]}
              <span className="sr-only">{i < current ? ", đã hoàn thành" : i === current ? ", hiện tại" : ", chưa tới"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
