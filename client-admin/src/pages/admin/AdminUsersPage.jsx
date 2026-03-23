import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";
import { resolvePublicUrl } from "../../utils/publicUrl.js";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    avatarUrl: "",
    paymentMethods: ["cod"],
    defaultPaymentMethod: "cod",
    password: "",
    isBlocked: false
  });

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
      : "rounded-2xl border border-rose-200 bg-white p-4 shadow-sm";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users`, { params: q ? { q } : {} });
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      alert("Không tải được danh sách khách hàng. Kiểm tra quyền admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => users, [users]);

  const resetForm = () => {
    setEditing(null);
    setAvatarFile(null);
    setForm({
      name: "",
      username: "",
      email: "",
      phone: "",
      avatarUrl: "",
      paymentMethods: ["cod"],
      defaultPaymentMethod: "cod",
      password: "",
      isBlocked: false
    });
  };

  const startEdit = (u) => {
    setEditing(u);
    setAvatarFile(null);
    setForm({
      name: u.name || "",
      username: u.username || "",
      email: u.email || "",
      phone: u.phone || "",
      avatarUrl: u.avatarUrl || "",
      paymentMethods: u.paymentMethods?.length ? u.paymentMethods : ["cod"],
      defaultPaymentMethod: u.defaultPaymentMethod || "cod",
      password: "",
      isBlocked: Boolean(u.isBlocked)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let nextAvatar = form.avatarUrl;
      if (avatarFile) {
        const data = new FormData();
        data.append("image", avatarFile);
        const up = await api.post("/uploads/avatar", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        nextAvatar = up.data.url;
      }
      if (editing?._id) {
        await api.put(`/admin/users/${editing._id}`, {
          name: form.name,
          phone: form.phone,
          avatarUrl: nextAvatar,
          paymentMethods: form.paymentMethods,
          defaultPaymentMethod: form.defaultPaymentMethod,
          isBlocked: form.isBlocked
        });
      } else {
        await api.post(`/admin/users`, {
          name: form.name,
          username: form.username,
          email: form.email,
          phone: form.phone,
          avatarUrl: nextAvatar,
          paymentMethods: form.paymentMethods,
          defaultPaymentMethod: form.defaultPaymentMethod,
          password: form.password,
          isBlocked: form.isBlocked
        });
      }
      resetForm();
      fetchUsers();
    } catch (e2) {
      console.error(e2);
      alert(e2.response?.data?.message || "Lỗi khi lưu khách hàng.");
    }
  };

  const toggleBlock = async (u) => {
    try {
      await api.put(`/admin/users/${u._id}`, { isBlocked: !u.isBlocked });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isBlocked: !u.isBlocked } : x)));
    } catch (e) {
      console.error(e);
      alert("Không thể cập nhật trạng thái chặn.");
    }
  };

  const resetPassword = async (u) => {
    try {
      const res = await api.post(`/admin/users/${u._id}/reset-password`);
      alert(res.data?.message || "Đặt lại mật khẩu thành công. Mật khẩu mới: Admin@123");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Không thể đặt lại mật khẩu.");
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Xóa khách hàng \"${u.name}\"?`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Không thể xóa khách hàng.");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        Bạn cần đăng nhập với tài khoản admin để truy cập trang này.
      </p>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr,2fr] gap-6">
      <div className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Khách hàng</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Thêm / sửa / xóa / chặn tài khoản khách.
        </p>

        {editing?._id && (
          <p className="text-xs mt-2 text-rose-600 dark:text-cyan-300">
            Đang sửa: <span className="font-semibold">{editing.email}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/40 shrink-0">
              {resolvePublicUrl(form.avatarUrl) ? (
                <img src={resolvePublicUrl(form.avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  AVT
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 dark:text-slate-400">Avatar (upload)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 dark:text-slate-400 mt-1"
              />
              <p className="text-[11px] text-slate-500 mt-1">png/jpg/webp • tối đa 5MB</p>
            </div>
          </div>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Họ tên"
            className={inputClass}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Số điện thoại"
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={form.isBlocked}
                onChange={(e) => setForm((f) => ({ ...f, isBlocked: e.target.checked }))}
              />
              Chặn tài khoản
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Phương thức thanh toán</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {[
                { id: "cod", label: "COD" },
                { id: "bank_transfer", label: "Chuyển khoản" },
                { id: "momo", label: "MoMo" },
                { id: "zalopay", label: "ZaloPay" }
              ].map((m) => (
                <label key={m.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                  <input
                    type="checkbox"
                    checked={form.paymentMethods.includes(m.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((f) => {
                        const next = checked
                          ? Array.from(new Set([...f.paymentMethods, m.id]))
                          : f.paymentMethods.filter((x) => x !== m.id);
                        const ensured = next.length ? next : ["cod"];
                        const nextDefault = ensured.includes(f.defaultPaymentMethod) ? f.defaultPaymentMethod : ensured[0];
                        return { ...f, paymentMethods: ensured, defaultPaymentMethod: nextDefault };
                      });
                    }}
                  />
                  <span className="text-slate-200">{m.label}</span>
                  <label className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <input
                      type="radio"
                      name="adminDefaultPayment"
                      checked={form.defaultPaymentMethod === m.id}
                      disabled={!form.paymentMethods.includes(m.id)}
                      onChange={() => setForm((f) => ({ ...f, defaultPaymentMethod: m.id }))}
                    />
                    Mặc định
                  </label>
                </label>
              ))}
            </div>
          </div>

          {!editing?._id && (
            <>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Username"
                className={inputClass}
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                className={inputClass}
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mật khẩu (>=6 ký tự)"
                className={inputClass}
                required
                minLength={6}
              />
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition"
            >
              {editing?._id ? "Lưu thay đổi" : "Thêm khách hàng"}
            </button>
            {editing?._id && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-700 text-slate-200 hover:border-slate-500 transition"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Danh sách khách hàng
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng: <span className="font-semibold">{users.length}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên / email / username / phone"
              className={inputClass}
            />
            <button
              onClick={fetchUsers}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-200 hover:border-cyan-400 transition"
            >
              Tìm
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải...</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div
                key={u._id}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/40 shrink-0">
                    {resolvePublicUrl(u.avatarUrl) ? (
                      <img src={resolvePublicUrl(u.avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                        AVT
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {u.name}{" "}
                      {u.isBlocked ? (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                          BỊ CHẶN
                        </span>
                      ) : (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          HOẠT ĐỘNG
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {u.email} • @{u.username}{u.phone ? ` • ${u.phone}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tạo lúc: {u.createdAt ? new Date(u.createdAt).toLocaleString("vi-VN") : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => startEdit(u)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => toggleBlock(u)}
                    className={
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition " +
                      (u.isBlocked
                        ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        : "bg-red-500/20 text-red-300 hover:bg-red-500/30")
                    }
                  >
                    {u.isBlocked ? "Mở chặn" : "Chặn"}
                  </button>
                  <button
                    onClick={() => resetPassword(u)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 text-slate-200 hover:border-cyan-400 transition"
                  >
                    Reset mật khẩu
                  </button>
                  <button
                    onClick={() => removeUser(u)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="text-center py-10 rounded-2xl border border-slate-800 bg-slate-900/40">
                <p className="text-sm text-slate-400">Không có khách hàng phù hợp.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

