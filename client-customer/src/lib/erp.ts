import { products } from "@/data/products";

export type PipelineStage = "new" | "qualified" | "proposal" | "won" | "lost";
export type PurchaseStatus = "draft" | "sent" | "received" | "cancelled";
export type InvoiceStatus = "draft" | "posted" | "paid" | "overdue";

export interface CrmLead {
  id: string;
  customer: string;
  channel: string;
  interest: string;
  stage: PipelineStage;
  expectedRevenue: number;
  probability: number;
  owner: string;
  nextAction: string;
}

export interface StockMove {
  id: string;
  product: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  date: string;
  reference: string;
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  eta: string;
  status: PurchaseStatus;
  total: number;
  items: string[];
}

export interface Invoice {
  id: string;
  customer: string;
  status: InvoiceStatus;
  dueDate: string;
  total: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: "new" | "silver" | "gold" | "vip";
  lifetimeValue: number;
  lastOrder: string;
}

export const crmLeads: CrmLead[] = [
  {
    id: "CRM-001",
    customer: "Minh Anh Collector",
    channel: "Facebook Ads",
    interest: "PG Unleashed + display case",
    stage: "proposal",
    expectedRevenue: 9200000,
    probability: 72,
    owner: "Sales A",
    nextAction: "Gửi báo giá combo tủ kính"
  },
  {
    id: "CRM-002",
    customer: "Hobby Club SG",
    channel: "Event",
    interest: "Bulk order HG/RG workshop",
    stage: "qualified",
    expectedRevenue: 18500000,
    probability: 55,
    owner: "Sales B",
    nextAction: "Chốt số lượng workshop"
  },
  {
    id: "CRM-003",
    customer: "Gia Bảo",
    channel: "Organic Search",
    interest: "MGEX pre-order",
    stage: "new",
    expectedRevenue: 3450000,
    probability: 35,
    owner: "Sales A",
    nextAction: "Nhắn lịch cọc pre-order"
  }
];

export const stockMoves: StockMove[] = [
  { id: "ST-001", product: "RG MSN-04 Sazabi", type: "out", quantity: 2, date: "2026-05-30", reference: "MS-10293" },
  { id: "ST-002", product: "Tamiya Side Cutter Alpha", type: "in", quantity: 24, date: "2026-05-29", reference: "PO-2026-018" },
  { id: "ST-003", product: "PG Unleashed RX-78-2", type: "out", quantity: 1, date: "2026-05-29", reference: "MS-10294" }
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2026-018",
    vendor: "Bandai Hobby Distributor",
    eta: "2026-06-08",
    status: "sent",
    total: 78200000,
    items: ["RG Hi-Nu Gundam x 24", "HG Calibarn x 36", "MG Barbatos x 12"]
  },
  {
    id: "PO-2026-019",
    vendor: "Good Smile Partner",
    eta: "2026-06-18",
    status: "draft",
    total: 42800000,
    items: ["Nendoroid Hatsune Miku x 18", "Display base x 40"]
  }
];

export const invoices: Invoice[] = [
  { id: "INV-2026-001", customer: "Nguyễn Minh Anh", status: "posted", dueDate: "2026-06-02", total: 6850000 },
  { id: "INV-2026-002", customer: "Trần Quốc Huy", status: "paid", dueDate: "2026-05-30", total: 1185000 },
  { id: "INV-2026-003", customer: "Hobby Club SG", status: "draft", dueDate: "2026-06-10", total: 18500000 }
];

export const customers: CustomerRecord[] = [
  { id: "C-001", name: "Nguyễn Minh Anh", email: "minhanh@example.com", phone: "0900000001", tier: "vip", lifetimeValue: 28600000, lastOrder: "MS-10294" },
  { id: "C-002", name: "Trần Quốc Huy", email: "huytran@example.com", phone: "0900000002", tier: "gold", lifetimeValue: 12450000, lastOrder: "MS-10293" },
  { id: "C-003", name: "Gia Bảo", email: "giabao@example.com", phone: "0900000003", tier: "silver", lifetimeValue: 3450000, lastOrder: "Pre-order lead" }
];

export const marketingCampaigns = [
  {
    id: "MKT-001",
    name: "Gunpla Starter Week",
    channel: "Facebook + TikTok",
    budget: 6500000,
    revenue: 38400000,
    status: "Running"
  },
  {
    id: "MKT-002",
    name: "MGEX Pre-order Drop",
    channel: "Email + Zalo OA",
    budget: 2200000,
    revenue: 27600000,
    status: "Scheduled"
  }
];

export function inventoryRows() {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.slug.toUpperCase().slice(0, 18),
    category: product.category,
    brand: product.brand,
    stock: product.stock,
    reserved: product.status === "pre-order" ? 12 : Math.min(4, Math.max(0, product.stock - 1)),
    reorderPoint: product.status === "limited" ? 3 : 8,
    value: product.stock * product.price
  }));
}

export function erpSummary() {
  const inventoryValue = inventoryRows().reduce((sum, item) => sum + item.value, 0);
  const pipelineValue = crmLeads.reduce((sum, lead) => sum + lead.expectedRevenue, 0);
  const receivable = invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + invoice.total, 0);
  const purchaseValue = purchaseOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    inventoryValue,
    pipelineValue,
    receivable,
    purchaseValue
  };
}
