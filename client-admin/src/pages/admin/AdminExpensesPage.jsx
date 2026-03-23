import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";

export default function AdminExpensesPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [qFrom, setQFrom] = useState("");
  const [qTo, setQTo] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Nhập hàng",
    expenseDate: "",
    note: ""
  });

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
      : "rounded-2xl border border-rose-200 bg-white p-4 shadow-sm";

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/expenses", {
        params: {
          ...(qFrom ? { from: qFrom } : {}),
          ...(qTo ? { to: qTo } : {})
        }
      });
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Không tải được khoản chi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(
    () => (items || []).reduce((s, x) => s + Number(x.amount || 0), 0),
    [items]
  );

  const resetForm = () => {
    setEditing(null);
    setForm({ title: "", amount: "", category: "Nhập hàng", expenseDate: "", note: "" });
  };

  const startEdit = (x) => {
    setEditing(x);
    setForm({
      title: x.title || "",
      amount: String(x.amount ?? ""),
      category: x.category || "Khác",
      expenseDate: x.expenseDate ? new Date(x.expenseDate).toISOString().slice(0, 10) : "",
      note: x.note || ""
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      note: form.note,
      expenseDate: form.expenseDate
    };
    try {
      if (editing?._id) {
        const res = await api.put(`/admin/expenses/${editing._id}`, payload);
        setItems((prev) => prev.map((p) => (p._id === editing._id ? res.data : p)));
      } else {
        const res = await api.post(`/admin/expenses`, payload);
        setItems((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (e2) {
      console.error(e2);
      alert(e2.response?.data?.message || "Không lưu được khoản chi.");
    }
  };

  const remove = async (x) => {
    if (!window.confirm(`Xóa khoản chi "${x.title}"?`)) return;
    try {
      await api.delete(`/admin/expenses/${x._id}`);
      setItems((prev) => prev.filter((p) => p._id !== x._id));
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Không xóa được.");
    }
  };

  return (
    <div className="grid lg:grid-cols-[1.1fr,2fr] gap-6">
      <div className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Khoản chi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Nhập chi phí nhập hàng, vận hành… để lên báo cáo thu–chi/lãi lỗ.
        </p>

        {editing?._id && (
          <p className="text-xs mt-2 text-rose-600 dark:text-cyan-300">
            Đang sửa: <span className="font-semibold">{editing.title}</span>
          </p>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={inputClass}
            placeholder="Tiêu đề (VD: Nhập hàng lô Gundam tháng 3)"
            required
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={inputClass}
              placeholder="Số tiền (VD: 1500000)"
              required
            />
            <input
              value={form.expenseDate}
              onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
              className={inputClass}
              type="date"
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={inputClass}
              placeholder="Danh mục (VD: Nhập hàng/Vận hành/Marketing)"
            />
            <input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className={inputClass}
              placeholder="Ghi chú (tuỳ chọn)"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={
                "px-4 py-2 rounded-xl text-sm font-semibold transition " +
                (theme === "dark"
                  ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  : "bg-rose-600 text-white hover:bg-rose-700")
              }
            >
              {editing?._id ? "Lưu thay đổi" : "Thêm khoản chi"}
            </button>
            {editing?._id && (
              <button
                type="button"
                onClick={resetForm}
                className={
                  "px-4 py-2 rounded-xl text-sm font-semibold border transition " +
                  (theme === "dark"
                    ? "border-slate-700 text-slate-200 hover:border-slate-500"
                    : "border-rose-300 text-slate-700 hover:border-rose-500")
                }
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Danh sách khoản chi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng: <span className="font-semibold">{items.length}</span> • Tổng tiền:{" "}
              <span className="font-semibold text-rose-600 dark:text-cyan-400">{total.toLocaleString("vi-VN")} ₫</span>
            </p>
          </div>
          <button
            onClick={fetchExpenses}
            className={
              "px-3 py-1.5 rounded-lg border text-xs transition " +
              (theme === "dark"
                ? "border-slate-700 hover:border-cyan-400 text-slate-200"
                : "border-rose-300 hover:border-rose-500 text-slate-700")
            }
          >
            Tải lại
          </button>
        </div>

        <div className={cardClass + " space-y-3"}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Từ ngày</p>
              <input className={inputClass} type="date" value={qFrom} onChange={(e) => setQFrom(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Đến ngày</p>
              <input className={inputClass} type="date" value={qTo} onChange={(e) => setQTo(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={fetchExpenses}
              className={
                "px-4 py-2 rounded-xl text-sm font-semibold transition " +
                (theme === "dark"
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-rose-100 text-rose-700 hover:bg-rose-200")
              }
            >
              Lọc
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải khoản chi...</p>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((x) => (
              <div key={x._id} className={cardClass + " flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{x.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {x.category || "Khác"} • {new Date(x.expenseDate).toLocaleDateString("vi-VN")}
                    {x.note ? ` • ${x.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-rose-600 dark:text-cyan-400">
                    {Number(x.amount || 0).toLocaleString("vi-VN")} ₫
                  </span>
                  <button
                    onClick={() => startEdit(x)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-200 hover:border-cyan-400 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => remove(x)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có khoản chi nào.</p>
        )}
      </div>
    </div>
  );
}

