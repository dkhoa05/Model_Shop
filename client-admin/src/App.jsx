import React from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { api, API_BASE } from "./services/api.js";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Movements", href: "/admin/movements" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Suppliers", href: "/admin/suppliers" },
  { label: "Purchase Orders", href: "/admin/purchase-orders" },
  { label: "Accounting", href: "/admin/accounting" },
  { label: "Approvals", href: "/admin/approvals" },
  { label: "Coupons", href: "/admin/coupons" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Settings", href: "/admin/settings" }
];

const orderStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
const leadStages = ["new", "qualified", "proposal", "won", "lost"];
const approvalTypes = ["discount", "refund", "purchase", "inventory_adjustment", "custom"];

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={user?.role === "admin" ? <AdminLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4">
          <div>
            <p className="text-lg font-black">MODELSHOP ERP</p>
            <p className="text-xs text-zinc-500">Sales, CRM, Inventory, Purchasing, Accounting</p>
          </div>
          <div className="flex items-center gap-3">
            <a href={import.meta.env.VITE_CUSTOMER_APP_URL || "http://localhost:3000"} target="_blank" rel="noreferrer" className="admin-button-secondary">
              Storefront
            </a>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{user?.name || "Admin"}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
            <button onClick={logout} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 lg:sticky lg:top-24">
          <p className="px-3 text-xs font-black uppercase tracking-[0.2em] text-red-400">Modules</p>
          <nav className="mt-2 grid gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href} className={`rounded-xl px-3 py-2 text-sm font-bold transition ${active ? "bg-red-600 text-white" : "text-zinc-300 hover:bg-zinc-950 hover:text-white"}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">{API_BASE}</p>
        </aside>

        <main className="min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<DashboardView />} />
            <Route path="/admin/products" element={<ProductsView />} />
            <Route path="/admin/orders" element={<OrdersView />} />
            <Route path="/admin/customers" element={<CustomersView />} />
            <Route path="/admin/inventory" element={<InventoryView />} />
            <Route path="/admin/movements" element={<MovementsView />} />
            <Route path="/admin/leads" element={<LeadsView />} />
            <Route path="/admin/suppliers" element={<SuppliersView />} />
            <Route path="/admin/purchase-orders" element={<PurchaseOrdersView />} />
            <Route path="/admin/accounting" element={<AccountingView />} />
            <Route path="/admin/approvals" element={<ApprovalsView />} />
            <Route path="/admin/coupons" element={<CouponsView />} />
            <Route path="/admin/reports" element={<ReportsView />} />
            <Route path="/admin/settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DashboardView() {
  const [stats, setStats] = React.useState(null);
  React.useEffect(() => {
    api.get("/admin/stats").then((res) => setStats(res.data)).catch(() => setStats(null));
  }, []);
  return (
    <section className="space-y-6">
      <PageHeader title="Dashboard" description="Tong quan van hanh realtime tu MongoDB." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value={formatVND(stats?.revenue?.all || 0)} />
        <MetricCard label="Orders" value={String(stats?.orders?.total || 0)} />
        <MetricCard label="Customers" value={String(stats?.customers || 0)} />
        <MetricCard label="Products" value={String(stats?.products || 0)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Leads" value={String(stats?.leads || 0)} />
        <MetricCard label="Open PO" value={String(stats?.purchaseOrdersOpen || 0)} />
        <MetricCard label="Open Invoices" value={String(stats?.invoicesOpen || 0)} />
        <MetricCard label="Approvals Pending" value={String(stats?.approvalsPending || 0)} />
      </div>
    </section>
  );
}

function ProductsView() {
  const [products, setProducts] = React.useState([]);
  React.useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data)).catch(() => setProducts([]));
  }, []);
  return (
    <section className="space-y-4">
      <PageHeader title="Products" description={`Tong ${products.length} san pham`} />
      <Panel title="Catalog">
        <SimpleProductTable products={products} />
      </Panel>
    </section>
  );
}

function OrdersView() {
  const [orders, setOrders] = React.useState([]);
  const load = React.useCallback(() => api.get("/orders").then((res) => setOrders(res.data)).catch(() => setOrders([])), []);
  React.useEffect(() => void load(), [load]);
  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}`, { status });
    load();
  };
  return (
    <section className="space-y-4">
      <PageHeader title="Orders" description={`Tong ${orders.length} don hang`} />
      <Panel title="Order pipeline">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500"><tr><th className="py-3">Code</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="py-3 font-bold text-white">{String(o._id).slice(-8).toUpperCase()}</td>
                  <td>{o.user?.name || o.recipientName || "Guest"}</td>
                  <td><select className="admin-input h-9 min-w-32" value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>{orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                  <td className="text-right text-red-300">{formatVND(o.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function CustomersView() {
  const [orders, setOrders] = React.useState([]);
  React.useEffect(() => { api.get("/orders").then((res) => setOrders(res.data)).catch(() => setOrders([])); }, []);
  const customers = Array.from(new Map(orders.map((o) => [o.user?.email || o.phone, o])).values());
  return (
    <section className="space-y-4">
      <PageHeader title="Customers" description={`Tong ${customers.length} khach mua hang`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {customers.map((c) => (
          <article key={c._id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <h3 className="font-black text-white">{c.user?.name || c.recipientName || "Guest"}</h3>
            <p className="text-sm text-zinc-400">{c.user?.email || c.guestEmail || "No email"}</p>
            <p className="text-sm text-zinc-400">{c.phone || "No phone"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InventoryView() {
  const [products, setProducts] = React.useState([]);
  React.useEffect(() => { api.get("/products").then((res) => setProducts(res.data)).catch(() => setProducts([])); }, []);
  return (
    <section className="space-y-4">
      <PageHeader title="Inventory" description="Ton kho hien tai theo san pham." />
      <Panel title="Stock ledger">
        <SimpleProductTable products={products} showValue />
      </Panel>
    </section>
  );
}

function MovementsView() {
  const [movements, setMovements] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [form, setForm] = React.useState({ product: "", type: "in", quantity: 1, reason: "manual", note: "" });
  const load = React.useCallback(() => api.get("/admin/inventory/movements").then((res) => setMovements(res.data)).catch(() => setMovements([])), []);
  React.useEffect(() => { load(); api.get("/products").then((res) => setProducts(res.data)).catch(() => setProducts([])); }, [load]);
  const submit = async (e) => { e.preventDefault(); await api.post("/admin/inventory/movements", { ...form, quantity: Number(form.quantity) }); setForm((p) => ({ ...p, quantity: 1, note: "" })); load(); };
  return (
    <section className="space-y-4">
      <PageHeader title="Inventory Movements" description="Dieu chinh kho thu cong hoac ghi nhan nhap xuat." />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="New movement">
          <form className="grid gap-3" onSubmit={submit}>
            <select className="admin-input" value={form.product} onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))} required><option value="">Select product</option>{products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>
            <select className="admin-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="in">in</option><option value="out">out</option><option value="adjustment">adjustment</option></select>
            <input className="admin-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
            <select className="admin-input" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}><option value="manual">manual</option><option value="purchase">purchase</option><option value="sale">sale</option><option value="return">return</option><option value="damage">damage</option></select>
            <textarea className="admin-input min-h-24 py-2" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Note" />
            <button className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Save</button>
          </form>
        </Panel>
        <Panel title="Recent movements">
          <div className="space-y-2">
            {movements.map((m) => <div key={m._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm"><p className="font-bold text-white">{m.product?.name || "Unknown product"}</p><p className="text-zinc-400">{m.type} {m.quantity} - {m.reason}</p><p className="text-xs text-zinc-500">{new Date(m.createdAt).toLocaleString("vi-VN")}</p></div>)}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function LeadsView() {
  const [leads, setLeads] = React.useState([]);
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", source: "website", expectedValue: 0, note: "" });
  const load = React.useCallback(() => api.get("/admin/leads").then((res) => setLeads(res.data)).catch(() => setLeads([])), []);
  React.useEffect(() => void load(), [load]);
  const createLead = async (e) => { e.preventDefault(); await api.post("/admin/leads", { ...form, expectedValue: Number(form.expectedValue || 0) }); setForm({ name: "", phone: "", email: "", source: "website", expectedValue: 0, note: "" }); load(); };
  const updateLeadStage = async (leadId, stage) => { await api.put(`/admin/leads/${leadId}`, { stage }); load(); };
  return (
    <section className="space-y-4">
      <PageHeader title="CRM Leads" description="Pipeline lead tu marketing va tu van ban hang." />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="New lead">
          <form className="grid gap-3" onSubmit={createLead}>
            <input className="admin-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Lead name" required />
            <input className="admin-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
            <input className="admin-input" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
            <select className="admin-input" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}><option value="website">website</option><option value="facebook">facebook</option><option value="zalo">zalo</option><option value="walk_in">walk_in</option><option value="other">other</option></select>
            <input className="admin-input" type="number" min="0" value={form.expectedValue} onChange={(e) => setForm((p) => ({ ...p, expectedValue: e.target.value }))} placeholder="Expected value" />
            <textarea className="admin-input min-h-24 py-2" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Note" />
            <button className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Create</button>
          </form>
        </Panel>
        <Panel title="Lead pipeline">
          <div className="space-y-2">
            {leads.map((lead) => (
              <div key={lead._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between gap-3"><div><p className="font-bold text-white">{lead.name}</p><p className="text-xs text-zinc-500">{lead.phone || lead.email || "No contact"}</p></div><select className="admin-input h-9 min-w-32" value={lead.stage} onChange={(e) => updateLeadStage(lead._id, e.target.value)}>{leadStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></div>
                <p className="mt-2 text-sm text-red-300">{formatVND(lead.expectedValue || 0)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function SuppliersView() {
  const [suppliers, setSuppliers] = React.useState([]);
  const [form, setForm] = React.useState({ name: "", contactName: "", phone: "", email: "", address: "" });
  const load = React.useCallback(() => api.get("/admin/suppliers").then((res) => setSuppliers(res.data)).catch(() => setSuppliers([])), []);
  React.useEffect(() => void load(), [load]);
  const createSupplier = async (e) => { e.preventDefault(); await api.post("/admin/suppliers", form); setForm({ name: "", contactName: "", phone: "", email: "", address: "" }); load(); };
  return (
    <section className="space-y-4">
      <PageHeader title="Suppliers" description="Nha cung cap va thong tin lien he nhap hang." />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="New supplier">
          <form className="grid gap-3" onSubmit={createSupplier}>
            <input className="admin-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Supplier name" required />
            <input className="admin-input" value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} placeholder="Contact name" />
            <input className="admin-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
            <input className="admin-input" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
            <textarea className="admin-input min-h-24 py-2" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" />
            <button className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Create</button>
          </form>
        </Panel>
        <Panel title="Supplier list">
          <div className="space-y-2">{suppliers.map((s) => <div key={s._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className="font-bold text-white">{s.name}</p><p className="text-sm text-zinc-400">{s.contactName || "No contact"} | {s.phone || "-"}</p><p className="text-sm text-zinc-500">{s.email || "No email"}</p></div>)}</div>
        </Panel>
      </div>
    </section>
  );
}

function PurchaseOrdersView() {
  const [purchaseOrders, setPurchaseOrders] = React.useState([]);
  const [suppliers, setSuppliers] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [form, setForm] = React.useState({ supplier: "", product: "", quantity: 1, unitCost: 0, expectedDate: "" });
  const load = React.useCallback(() => api.get("/admin/purchase-orders").then((res) => setPurchaseOrders(res.data)).catch(() => setPurchaseOrders([])), []);
  React.useEffect(() => { load(); api.get("/admin/suppliers").then((res) => setSuppliers(res.data)).catch(() => setSuppliers([])); api.get("/products").then((res) => setProducts(res.data)).catch(() => setProducts([])); }, [load]);
  const createPo = async (e) => { e.preventDefault(); await api.post("/admin/purchase-orders", { supplier: form.supplier, items: [{ product: form.product, quantity: Number(form.quantity), unitCost: Number(form.unitCost) }], expectedDate: form.expectedDate || null }); setForm({ supplier: "", product: "", quantity: 1, unitCost: 0, expectedDate: "" }); load(); };
  const receivePo = async (id) => { await api.post(`/admin/purchase-orders/${id}/receive`); load(); };
  return (
    <section className="space-y-4">
      <PageHeader title="Purchase Orders" description="Dat hang nha cung cap va nhan hang tu dong tang kho." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Panel title="Create PO">
          <form className="grid gap-3" onSubmit={createPo}>
            <select className="admin-input" value={form.supplier} onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))} required><option value="">Select supplier</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select>
            <select className="admin-input" value={form.product} onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))} required><option value="">Select product</option>{products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select>
            <input className="admin-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
            <input className="admin-input" type="number" min="0" value={form.unitCost} onChange={(e) => setForm((p) => ({ ...p, unitCost: e.target.value }))} />
            <input className="admin-input" type="date" value={form.expectedDate} onChange={(e) => setForm((p) => ({ ...p, expectedDate: e.target.value }))} />
            <button className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Create PO</button>
          </form>
        </Panel>
        <Panel title="PO list">
          <div className="space-y-2">
            {purchaseOrders.map((po) => <div key={po._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-white">{po.code}</p><p className="text-xs text-zinc-500">{po.supplier?.name || "No supplier"} | {po.status}</p><p className="text-xs text-amber-300">{po.requiresApproval ? `Approval: ${po.approvalRequest?.status || "pending"}` : "No approval required"}</p></div>{po.status !== "received" && po.status !== "cancelled" ? <button onClick={() => receivePo(po._id)} className="admin-button-secondary">Receive</button> : null}</div><p className="mt-2 text-sm text-zinc-400">Total: <span className="font-bold text-red-300">{formatVND(po.totalAmount || 0)}</span></p></div>)}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function AccountingView() {
  const [orders, setOrders] = React.useState([]);
  const [invoices, setInvoices] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);
  const [entries, setEntries] = React.useState([]);
  const load = React.useCallback(() => {
    api.get("/orders").then((res) => setOrders(res.data)).catch(() => setOrders([]));
    api.get("/admin/invoices").then((res) => setInvoices(res.data)).catch(() => setInvoices([]));
    api.get("/admin/accounts").then((res) => setAccounts(res.data)).catch(() => setAccounts([]));
    api.get("/admin/journal-entries").then((res) => setEntries(res.data)).catch(() => setEntries([]));
  }, []);
  React.useEffect(() => void load(), [load]);
  const createFromOrder = async (orderId) => { await api.post(`/admin/invoices/from-order/${orderId}`); load(); };
  const markPaid = async (invoiceId) => { await api.put(`/admin/invoices/${invoiceId}`, { status: "paid" }); load(); };
  const requestRefund = async (orderId) => { await api.post(`/orders/${orderId}/refund-request`); load(); };
  const executeRefund = async (orderId) => { await api.post(`/orders/${orderId}/refund/execute`); load(); };
  const invoicedOrderIds = new Set(invoices.filter((i) => i.order?._id).map((i) => i.order._id));
  return (
    <section className="space-y-4">
      <PageHeader title="Accounting" description="Quan ly hoa don, chart of accounts va journal entries." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Create invoice from order">
          <div className="space-y-2">
            {orders.slice(0, 20).map((order) => (
              <div key={order._id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm">
                <div><p className="font-bold text-white">{order.paymentRef || String(order._id).slice(-8)}</p><p className="text-zinc-500">{order.recipientName || order.user?.name || "Guest"} | {formatVND(order.totalPrice)}</p></div>
                <button disabled={invoicedOrderIds.has(order._id)} onClick={() => createFromOrder(order._id)} className="admin-button-secondary disabled:opacity-40">
                  {invoicedOrderIds.has(order._id) ? "Invoiced" : "Create"}
                </button>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Invoice list">
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-white">{invoice.code}</p><p className="text-xs text-zinc-500">{invoice.customerName} | {invoice.status}</p></div>
                  {invoice.status !== "paid" && invoice.status !== "cancelled" ? <button onClick={() => markPaid(invoice._id)} className="admin-button-secondary">Mark paid</button> : null}
                </div>
                <p className="mt-2 text-sm text-red-300">{formatVND(invoice.totalAmount || 0)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Refund workflow">
        <div className="space-y-2">
          {orders.filter((o) => o.paymentStatus === "paid").slice(0, 20).map((order) => (
            <div key={order._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{order.paymentRef || String(order._id).slice(-8)}</p>
                  <p className="text-xs text-zinc-500">{order.recipientName || order.user?.name || "Guest"} | {formatVND(order.totalPrice || 0)}</p>
                  <p className="text-xs text-amber-300">Refund status: {order.refundStatus || "none"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => requestRefund(order._id)} className="admin-button-secondary">Request refund</button>
                  <button onClick={() => executeRefund(order._id)} className="admin-button-secondary">Execute refund</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Chart of accounts">
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="font-bold text-white">{account.code} - {account.name}</p>
                <p className="text-xs text-zinc-500">{account.type} | {account.active ? "active" : "inactive"}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Journal entries">
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <p className="font-bold text-white">{entry.description || entry.refType}</p>
                <p className="text-xs text-zinc-500">{new Date(entry.date).toLocaleString("vi-VN")} | {entry.refType}:{entry.refId}</p>
                <div className="mt-2 space-y-1">
                  {entry.lines?.map((line, idx) => (
                    <p key={idx} className="text-xs text-zinc-400">
                      {line.account?.code || "-"} {line.account?.name || "Unknown"} | Dr {formatVND(line.debit || 0)} | Cr {formatVND(line.credit || 0)}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function ApprovalsView() {
  const [approvals, setApprovals] = React.useState([]);
  const [form, setForm] = React.useState({ type: "custom", title: "", payload: "", requiredApprovals: 1 });
  const load = React.useCallback(() => api.get("/admin/approvals").then((res) => setApprovals(res.data)).catch(() => setApprovals([])), []);
  React.useEffect(() => void load(), [load]);
  const createApproval = async (e) => {
    e.preventDefault();
    let parsedPayload = {};
    if (form.payload.trim()) {
      try { parsedPayload = JSON.parse(form.payload); } catch { parsedPayload = { raw: form.payload }; }
    }
    await api.post("/admin/approvals", { type: form.type, title: form.title, payload: parsedPayload, requiredApprovals: Number(form.requiredApprovals || 1) });
    setForm({ type: "custom", title: "", payload: "", requiredApprovals: 1 });
    load();
  };
  const decide = async (id, status) => { await api.post(`/admin/approvals/${id}/decide`, { status }); load(); };
  return (
    <section className="space-y-4">
      <PageHeader title="Approvals" description="Quy trinh phe duyet cho discount/refund/purchase." />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="New approval request">
          <form className="grid gap-3" onSubmit={createApproval}>
            <select className="admin-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>{approvalTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <input className="admin-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Request title" required />
            <input className="admin-input" type="number" min="1" value={form.requiredApprovals} onChange={(e) => setForm((p) => ({ ...p, requiredApprovals: e.target.value }))} placeholder="Required approvals" />
            <textarea className="admin-input min-h-28 py-2" value={form.payload} onChange={(e) => setForm((p) => ({ ...p, payload: e.target.value }))} placeholder='Payload JSON, vd: {"orderId":"..."}' />
            <button className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Create</button>
          </form>
        </Panel>
        <Panel title="Approval queue">
          <div className="space-y-2">
            {approvals.map((a) => (
              <div key={a._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{a.title}</p>
                    <p className="text-xs text-zinc-500">{a.type} | {a.status} | {a.approvalSteps?.filter((s) => s.status === "approved").length || 0}/{a.requiredApprovals || 1}</p>
                  </div>
                  {a.status === "pending" ? <div className="flex gap-2"><button onClick={() => decide(a._id, "approved")} className="admin-button-secondary">Approve</button><button onClick={() => decide(a._id, "rejected")} className="admin-button-secondary">Reject</button></div> : null}
                </div>
                {a.approvalSteps?.length ? (
                  <div className="mt-2 space-y-1">
                    {a.approvalSteps.map((step, idx) => (
                      <p key={idx} className="text-xs text-zinc-400">
                        {step.approver?.name || "Admin"}: {step.status} ({new Date(step.at).toLocaleString("vi-VN")})
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function CouponsView() {
  const [coupons, setCoupons] = React.useState([]);
  const [form, setForm] = React.useState({ code: "", type: "percent", value: 10, minOrderSubtotal: 0 });
  const load = React.useCallback(() => api.get("/admin/coupons").then((res) => setCoupons(res.data)).catch(() => setCoupons([])), []);
  React.useEffect(() => void load(), [load]);
  const createCoupon = async (e) => { e.preventDefault(); await api.post("/admin/coupons", { ...form, code: String(form.code).trim().toUpperCase(), value: Number(form.value), minOrderSubtotal: Number(form.minOrderSubtotal) }); setForm({ code: "", type: "percent", value: 10, minOrderSubtotal: 0 }); load(); };
  return (
    <section className="space-y-4">
      <PageHeader title="Coupons" description="Quan ly khuyen mai cho storefront." />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="New coupon">
          <form className="grid gap-3" onSubmit={createCoupon}>
            <input className="admin-input" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" required />
            <select className="admin-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="percent">percent</option><option value="fixed">fixed</option></select>
            <input className="admin-input" type="number" min="1" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} />
            <input className="admin-input" type="number" min="0" value={form.minOrderSubtotal} onChange={(e) => setForm((p) => ({ ...p, minOrderSubtotal: e.target.value }))} />
            <button className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Create</button>
          </form>
        </Panel>
        <Panel title="Coupon list">
          <div className="space-y-2">{coupons.map((coupon) => <div key={coupon._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className="font-bold text-white">{coupon.code}</p><p className="text-sm text-zinc-400">{coupon.type} {coupon.value} | used {coupon.usedCount || 0}</p></div>)}</div>
        </Panel>
      </div>
    </section>
  );
}

function ReportsView() {
  const [stats, setStats] = React.useState(null);
  const [trialBalance, setTrialBalance] = React.useState(null);
  const [pnl, setPnl] = React.useState(null);
  const [arAging, setArAging] = React.useState(null);
  const [financeKpis, setFinanceKpis] = React.useState(null);
  React.useEffect(() => {
    api.get("/admin/stats").then((res) => setStats(res.data)).catch(() => setStats(null));
    api.get("/admin/reports/trial-balance").then((res) => setTrialBalance(res.data)).catch(() => setTrialBalance(null));
    api.get("/admin/reports/pnl").then((res) => setPnl(res.data)).catch(() => setPnl(null));
    api.get("/admin/reports/ar-aging").then((res) => setArAging(res.data)).catch(() => setArAging(null));
    api.get("/admin/reports/finance-kpis").then((res) => setFinanceKpis(res.data)).catch(() => setFinanceKpis(null));
  }, []);
  return (
    <section className="space-y-4">
      <PageHeader title="Reports" description="Snapshot bao cao nhanh theo du lieu live." />
      <div className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="P&L Revenue" value={formatVND(pnl?.totals?.revenue || 0)} />
        <MetricCard label="P&L Expense" value={formatVND(pnl?.totals?.expense || 0)} />
        <MetricCard label="P&L Profit" value={formatVND(pnl?.totals?.profit || 0)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="AR 0-30" value={formatVND(arAging?.totals?.["0_30"] || 0)} />
        <MetricCard label="AR 31-60" value={formatVND(arAging?.totals?.["31_60"] || 0)} />
        <MetricCard label="AR 61-90" value={formatVND(arAging?.totals?.["61_90"] || 0)} />
        <MetricCard label="AR >90" value={formatVND(arAging?.totals?.["90_plus"] || 0)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Gross Margin" value={`${(((financeKpis?.totals?.grossMargin || 0) * 100)).toFixed(2)}%`} />
        <MetricCard label="Refund Rate" value={`${(((financeKpis?.totals?.refundRate || 0) * 100)).toFixed(2)}%`} />
        <MetricCard label="AR Turnover" value={(financeKpis?.totals?.arTurnover || 0).toFixed(2)} />
        <MetricCard label="Refund Amount" value={formatVND(financeKpis?.totals?.refundAmount || 0)} />
      </div>
      <Panel title="Payment channels"><pre className="overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-300">{JSON.stringify(stats?.payment || {}, null, 2)}</pre></Panel>
      <Panel title="Trial balance">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500"><tr><th className="py-3">Account</th><th>Type</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Balance</th></tr></thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
              {(trialBalance?.rows || []).map((row) => (
                <tr key={row.accountId}>
                  <td className="py-3 font-bold text-white">{row.code} - {row.name}</td>
                  <td>{row.type}</td>
                  <td className="text-right">{formatVND(row.debit)}</td>
                  <td className="text-right">{formatVND(row.credit)}</td>
                  <td className="text-right">{formatVND(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function SettingsView() {
  const [admins, setAdmins] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });

  const loadAdmins = React.useCallback(() => {
    api.get("/admin/admins").then((res) => setAdmins(res.data)).catch(() => setAdmins([]));
  }, []);

  React.useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const createAdmin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/admin/admins", form);
      setForm({ name: "", username: "", email: "", phone: "", password: "" });
      setMessage("Tao admin moi thanh cong.");
      loadAdmins();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Khong tao duoc admin.");
    }
  };

  const toggleBlock = async (admin) => {
    await api.put(`/admin/admins/${admin._id}`, { isBlocked: !admin.isBlocked });
    loadAdmins();
  };

  const resetPassword = async (admin) => {
    const res = await api.post(`/admin/admins/${admin._id}/reset-password`);
    setMessage(res.data?.message || "Reset xong.");
  };

  return (
    <section className="space-y-4">
      <PageHeader title="Settings" description="Kiem tra cau hinh he thong truoc khi van hanh." />
      <Panel title="Checklist"><div className="grid gap-2 text-sm text-zinc-300"><p>MongoDB connected</p><p>Server API online</p><p>Customer app running</p><p>Admin app running</p><p>SMTP configured (optional)</p></div></Panel>
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Panel title="Create admin user">
          <form className="grid gap-3" onSubmit={createAdmin}>
            <input className="admin-input" placeholder="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <input className="admin-input" placeholder="Username" value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} required />
            <input className="admin-input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
            <input className="admin-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <input className="admin-input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
            <button className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase text-white hover:bg-red-500">Create admin</button>
          </form>
          {message ? <p className="mt-2 text-xs text-cyan-300">{message}</p> : null}
        </Panel>
        <Panel title="Admin accounts">
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin._id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{admin.name} ({admin.username})</p>
                    <p className="text-xs text-zinc-500">{admin.email} | {admin.phone || "-"}</p>
                    <p className="text-xs text-amber-300">{admin.isBlocked ? "Blocked" : "Active"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleBlock(admin)} className="admin-button-secondary">
                      {admin.isBlocked ? "Unblock" : "Block"}
                    </button>
                    <button onClick={() => resetPassword(admin)} className="admin-button-secondary">
                      Reset pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function SimpleProductTable({ products, showValue = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500"><tr><th className="py-3">Name</th><th>Category</th><th>Stock</th><th className="text-right">{showValue ? "Value" : "Price"}</th></tr></thead>
        <tbody className="divide-y divide-zinc-800 text-zinc-300">
          {products.map((p) => <tr key={p._id}><td className="py-3 font-bold text-white">{p.name}</td><td>{p.category}</td><td>{p.stock}</td><td className="text-right text-red-300">{showValue ? formatVND((p.stock || 0) * (p.price || 0)) : formatVND(p.price)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

function PageHeader({ title, description }) { return (<header><h1 className="text-3xl font-black text-white">{title}</h1><p className="mt-1 text-sm text-zinc-400">{description}</p></header>); }
function Panel({ title, children }) { return (<section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><h2 className="mb-3 text-base font-black text-white">{title}</h2>{children}</section>); }
function MetricCard({ label, value }) { return (<article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"><p className="text-xs uppercase text-zinc-500">{label}</p><p className="mt-2 text-2xl font-black text-red-300">{value}</p></article>); }
function formatVND(value) { return `${Number(value || 0).toLocaleString("vi-VN")}₫`; }
