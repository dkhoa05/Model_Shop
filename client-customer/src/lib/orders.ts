import { CartItem } from "@/context/CartContext";

export type OrderStatus = "pending" | "confirmed" | "packing" | "shipping" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
}

export interface OrderLineItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  customerId?: string;
  customer: CustomerInfo;
  items: OrderLineItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  source: "storefront" | "admin";
}

export interface CreateOrderInput {
  customerId?: string;
  customer: CustomerInfo;
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
}

const ORDERS_KEY = "model-shop-orders";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy"
};

export function createOrder(input: CreateOrderInput): OrderRecord {
  const order: OrderRecord = {
    id: createOrderId(),
    createdAt: new Date().toISOString(),
    customerId: input.customerId,
    customer: input.customer,
    items: input.cartItems.map((item) => ({
      productId: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      brand: item.product.brand,
      image: item.product.images[0],
      price: item.product.price,
      quantity: item.quantity
    })),
    subtotal: input.subtotal,
    shipping: input.shipping,
    discount: input.discount || 0,
    total: input.total,
    shippingMethod: input.shippingMethod,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "bank" ? "unpaid" : "unpaid",
    status: "pending",
    source: "storefront"
  };

  const orders = getOrders();
  saveOrders([order, ...orders]);
  return order;
}

export function getOrders(): OrderRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(ORDERS_KEY);
  if (!raw) {
    const seeded = getSeedOrders();
    saveOrders(seeded);
    return seeded;
  }

  try {
    return JSON.parse(raw) as OrderRecord[];
  } catch {
    return [];
  }
}

export function getOrderById(id: string): OrderRecord | undefined {
  return getOrders().find((order) => order.id === id);
}

export function getOrdersByCustomer(email?: string): OrderRecord[] {
  if (!email) {
    return [];
  }

  return getOrders().filter((order) => order.customer.email.toLowerCase() === email.toLowerCase());
}

export function updateOrderStatus(id: string, status: OrderStatus): OrderRecord[] {
  const nextOrders = getOrders().map((order) => (order.id === id ? { ...order, status } : order));
  saveOrders(nextOrders);
  return nextOrders;
}

export function saveOrders(orders: OrderRecord[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

function createOrderId() {
  const value = Math.floor(10000 + Math.random() * 89999);
  return `MS-${value}`;
}

function getSeedOrders(): OrderRecord[] {
  return [
    {
      id: "MS-10294",
      createdAt: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
      customer: {
        name: "Nguyễn Minh Anh",
        phone: "0900000001",
        email: "minhanh@example.com",
        address: "Quận 1, TP.HCM"
      },
      items: [
        {
          productId: "p-001",
          slug: "pg-unleashed-rx-78-2-gundam",
          name: "Bandai PG Unleashed RX-78-2 Gundam 1/60",
          brand: "Bandai Spirits",
          image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=85&w=1200",
          price: 6850000,
          quantity: 1
        }
      ],
      subtotal: 6850000,
      shipping: 0,
      discount: 0,
      total: 6850000,
      shippingMethod: "standard",
      paymentMethod: "bank",
      paymentStatus: "unpaid",
      status: "packing",
      source: "storefront"
    },
    {
      id: "MS-10293",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      customer: {
        name: "Trần Quốc Huy",
        phone: "0900000002",
        email: "huytran@example.com",
        address: "Thủ Đức, TP.HCM"
      },
      items: [
        {
          productId: "p-002",
          slug: "rg-msn-04-sazabi",
          name: "Bandai RG MSN-04 Sazabi 1/144",
          brand: "Bandai Spirits",
          image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?auto=format&fit=crop&q=85&w=1200",
          price: 1150000,
          quantity: 1
        }
      ],
      subtotal: 1150000,
      shipping: 35000,
      discount: 0,
      total: 1185000,
      shippingMethod: "express",
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      status: "shipping",
      source: "storefront"
    }
  ];
}
