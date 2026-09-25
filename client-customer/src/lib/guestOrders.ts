const KEY = "model-shop-guest-orders";

function read(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/** Token tra cứu đơn của khách vãng lai (chỉ có hiệu lực cho đúng đơn đó) */
export function saveGuestOrderToken(orderId: string, token: string) {
  const map = read();
  map[orderId] = token;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function getGuestOrderToken(orderId: string): string {
  return read()[orderId] || "";
}
