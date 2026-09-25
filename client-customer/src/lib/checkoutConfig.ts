import { API_BASE_URL } from "@/lib/api";

export interface CheckoutConfig {
  shippingFlatFee: number;
  freeShippingThreshold: number;
  pickupAddress: string;
}

export const defaultCheckoutConfig: CheckoutConfig = {
  shippingFlatFee: 30000,
  freeShippingThreshold: 500000,
  pickupAddress: ""
};

/** Dùng phía server (RSC) — lỗi API thì dùng giá trị mặc định */
export async function getCheckoutConfigSafe(): Promise<CheckoutConfig> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/payment-config/checkout`, { next: { revalidate: 60 } });
    if (!res.ok) return defaultCheckoutConfig;
    return (await res.json()) as CheckoutConfig;
  } catch {
    return defaultCheckoutConfig;
  }
}
