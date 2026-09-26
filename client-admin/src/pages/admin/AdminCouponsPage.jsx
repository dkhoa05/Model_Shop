import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";

const emptyForm = {
  code: "",
  type: "percent",
  value: "",
  maxDiscountAmount: "",
  minOrderSubtotal: "0",
  active: true,
  expiresAt: "",
  usageLimit: "",
  description: "",
  applicableProductIds: []
};

export default function AdminCouponsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
      : "rounded-2xl border border-rose-200 bg-white p-4 shadow-sm";

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const fetchList = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/admin/coupons");
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      setMsg(e.response?.data?.message || "Không tải được danh sách mã.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchList();
  }, [user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    api
      .get("/products")
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]));
  }, [user]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const startEdit = (x) => {
    setEditing(x);
    const ids = Array.isArray(x.applicableProductIds) ? x.applicableProductIds.map((id) => String(id)) : [];
    setForm({
      code: x.code || "",
      type: x.type || "percent",
      value: String(x.value ?? ""),
      maxDiscountAmount: x.maxDiscountAmount != null ? String(x.maxDiscountAmount) : "",
      minOrderSubtotal: String(x.minOrderSubtotal ?? 0),
      active: x.active !== false,
      expiresAt: x.expiresAt ? new Date(x.expiresAt).toISOString().slice(0, 10) : "",
      usageLimit: x.usageLimit != null ? String(x.usageLimit) : "",
      description: x.description || "",
      applicableProductIds: ids
    });
  };

  const toggleProductPick = (id) => {
    const sid = String(id);
    setForm((f) => {
      const set = new Set(f.applicableProductIds || []);
      if (set.has(sid)) set.delete(sid);
      else set.add(sid);
      return { ...f, applicableProductIds: [...set] };
    });
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (p.name || "").toLowerCase().includes(q) || String(p._id).toLowerCase().includes(q);
  });

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      maxDiscountAmount: form.type === "percent" && form.maxDiscountAmount !== "" ? Number(form.maxDiscountAmount) : null,
      minOrderSubtotal: Number(form.minOrderSubtotal) || 0,
      active: form.active,
      expiresAt: form.expiresAt || null,
      usageLimit: form.usageLimit !== "" ? Number(form.usageLimit) : null,
      description: form.description,
      applicableProductIds: form.applicableProductIds?.length ? form.applicableProductIds : []
    };
    try {
      if (editing?._id) {
        const res = await api.put(`/admin/coupons/${editing._id}`, payload);
        setItems((prev) => prev.map((p) => (p._id === editing._id ? res.data : p)));
      } else {
        const res = await api.post("/admin/coupons", payload);
        setItems((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (e2) {
      setMsg(e2.response?.data?.message || "Không lưu được mã giảm giá.");
    }
  };

  const remove = async (x) => {
    if (!window.confirm(`Xóa mã "${x.code}"?`)) return;
    try {
      await api.delete(`/admin/coupons/${x._id}`);
      setItems((prev) => prev.filter((p) => p._id !== x._id));
      if (editing?._id === x._id) resetForm();
    } catch (e) {
      setMsg(e.response?.data?.message || "Không xóa được.");
    }
  };

  if (!user || user.role !== "admin") {
    return <p className="text-sm text-slate-500 dark:text-slate-300">Cần đăng nhập admin.</p>;
  }

  return (
    <div className="grid lg:grid-cols-[1.15fr,2fr] gap-6">
      <div className={cardClass}>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mã giảm giá</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tạo mã % hoặc số tiền cố định. Khách nhập mã ở bước thanh toán (checkout).
        </p>
        {editing?._id && (
          <p className="text-xs mt-2 text-cyan-600 dark:text-cyan-300">
            Đang sửa: <span className="font-mono font-semibold">{editing.code}</span>
          </p>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3 text-sm">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Mã (in hoa, không dấu cách thừa)</label>
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="VD: SUMMER2026"
              required
              disabled={!!editing?._id}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Loại giảm</label>
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="percent">Theo phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (₫)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {form.type === "percent" ? "Phần trăm giảm (1–100)" : "Số tiền giảm (₫)"}
            </label>
            <input
              className={inputClass}
              type="number"
              min={form.type === "percent" ? 1 : 0}
              max={form.type === "percent" ? 100 : undefined}
              step={form.type === "percent" ? 1 : 1000}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              required
            />
          </div>
          {form.type === "percent" && (
            <div>
              <label className="text-xs text-slate-500 block mb-1">Trần tiền giảm (₫, tuỳ chọn)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                step={1000}
                value={form.maxDiscountAmount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                placeholder="Để trống = không giới hạn thêm"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 block mb-1">Tổng tiền hàng tối thiểu (₫)</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              step={1000}
              value={form.minOrderSubtotal}
              onChange={(e) => setForm((f) => ({ ...f, minOrderSubtotal: e.target.value }))}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Không chọn sản phẩm bên dưới: áp trên <span className="font-medium">cả giỏ</span>. Có chọn SP: áp trên{" "}
              <span className="font-medium">tổng tiền các dòng thuộc SP đó</span>.
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Sản phẩm áp dụng (tuỳ chọn)</label>
            <p className="text-[11px] text-slate-500 mb-2">
              Để trống = mọi sản phẩm. Chọn một hoặc nhiều = chỉ giảm giá trên các dòng đó (và kiểm tra tối thiểu trên phần đó).
            </p>
            <input
              className={inputClass + " mb-2"}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Lọc theo tên sản phẩm…"
            />
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/40 p-2 space-y-1">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-slate-500 px-1">Không có sản phẩm hoặc chưa tải.</p>
              ) : (
                filteredProducts.slice(0, 80).map((p) => {
                  const id = String(p._id);
                  const checked = (form.applicableProductIds || []).includes(id);
                  return (
                    <label
                      key={id}
                      className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-800/60 rounded-lg px-1 py-0.5"
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleProductPick(id)} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        <span className="font-mono text-slate-500">{id.slice(-6)}</span> — {p.name}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {(form.applicableProductIds || []).length > 0 && (
              <button
                type="button"
                className="text-xs text-cyan-400 hover:underline mt-1"
                onClick={() => setForm((f) => ({ ...f, applicableProductIds: [] }))}
              >
                Bỏ chọn tất cả sản phẩm
              </button>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Hết hạn (tuỳ chọn)</label>
            <input
              className={inputClass}
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Giới hạn lượt dùng (tuỳ chọn)</label>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              placeholder="Để trống = không giới hạn"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Mô tả gợi ý (hiện ở checkout)</label>
            <input
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="VD: Giảm 10% cho đơn đầu tiên"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Đang hoạt động
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className={
                "px-4 py-2 rounded-xl text-sm font-semibold " +
                (theme === "dark" ? "bg-cyan-600 text-on-accent hover:bg-cyan-500" : "bg-rose-600 text-on-accent hover:bg-rose-700")
              }
            >
              {editing?._id ? "Cập nhật" : "Tạo mã"}
            </button>
            {editing?._id && (
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-sm border border-slate-600 text-slate-300">
                Hủy sửa
              </button>
            )}
          </div>
        </form>
        {msg && <p className="text-xs text-amber-600 dark:text-amber-300 mt-3">{msg}</p>}
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Danh sách</h2>
          <button
            type="button"
            onClick={fetchList}
            className="text-xs px-2 py-1 rounded-lg border border-slate-600 text-slate-300 hover:border-cyan-400"
          >
            Tải lại
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải…</p>
        ) : !items.length ? (
          <p className="text-sm text-slate-500">Chưa có mã. Chạy seed hoặc tạo mới bên trái.</p>
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-700">
                  <th className="py-2 pr-2">Mã</th>
                  <th className="py-2 pr-2">Phạm vi</th>
                  <th className="py-2 pr-2">Giảm</th>
                  <th className="py-2 pr-2">Lượt</th>
                  <th className="py-2 pr-2">Hết hạn</th>
                  <th className="py-2 pr-2">Trạng thái</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x._id} className="border-b border-slate-800/80 text-slate-200">
                    <td className="py-2 pr-2 font-mono font-medium">{x.code}</td>
                    <td className="py-2 pr-2 text-xs text-slate-400">
                      {Array.isArray(x.applicableProductIds) && x.applicableProductIds.length > 0
                        ? `${x.applicableProductIds.length} SP`
                        : "Tất cả"}
                    </td>
                    <td className="py-2 pr-2 text-xs">
                      {x.type === "percent"
                        ? `${x.value}%${x.maxDiscountAmount != null ? ` (max ${Number(x.maxDiscountAmount).toLocaleString("vi-VN")}₫)` : ""}`
                        : `${Number(x.value).toLocaleString("vi-VN")} ₫`}
                      {x.minOrderSubtotal > 0 && (
                        <span className="block text-slate-500">từ {Number(x.minOrderSubtotal).toLocaleString("vi-VN")}₫</span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-xs">
                      {x.usedCount ?? 0}
                      {x.usageLimit != null ? ` / ${x.usageLimit}` : ""}
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-400">
                      {x.expiresAt ? new Date(x.expiresAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="py-2 pr-2">{x.active ? "Bật" : "Tắt"}</td>
                    <td className="py-2 text-right space-x-1 whitespace-nowrap">
                      <button type="button" className="text-cyan-400 hover:underline text-xs" onClick={() => startEdit(x)}>
                        Sửa
                      </button>
                      <button type="button" className="text-red-400 hover:underline text-xs" onClick={() => remove(x)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
