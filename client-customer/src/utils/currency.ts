export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function clampQuantity(value: number, max = 99): number {
  if (Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.min(Math.floor(value), max);
}
