/** Vai trò nội bộ và quyền vào từng module (khớp phân quyền phía server) */
export const BACKOFFICE_ROLES = ["admin", "staff", "accountant"];

export const ROLE_LABELS = { admin: "Admin", staff: "Nhân viên bán hàng/kho", accountant: "Kế toán" };

const STAFF = ["admin", "staff"];
const FINANCE = ["admin", "accountant"];
const ALL = BACKOFFICE_ROLES;

/** Mỗi đường dẫn → các vai trò được vào */
export const ROUTE_ROLES = {
  "/admin": ALL,
  "/admin/products": STAFF,
  "/admin/orders": ALL,
  "/admin/customers": ["admin"],
  "/admin/inventory": STAFF,
  "/admin/movements": STAFF,
  "/admin/leads": STAFF,
  "/admin/suppliers": STAFF,
  "/admin/purchase-orders": STAFF,
  "/admin/accounting": FINANCE,
  "/admin/approvals": ALL,
  "/admin/coupons": STAFF,
  "/admin/expenses": FINANCE,
  "/admin/sales-reports": FINANCE,
  "/admin/reports": FINANCE,
  "/admin/payment-config": ["admin"],
  "/admin/settings": ["admin"]
};

export const canAccess = (role, path) => (ROUTE_ROLES[path] || ["admin"]).includes(role);
