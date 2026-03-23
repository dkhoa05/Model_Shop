import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { api, API_BASE } from "../services/api.js";

export default function ProfilePage() {
  const { user, token, login, logout } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(["cod"]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("cod");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setAvatarUrl(user?.avatarUrl || "");
    setPaymentMethods(user?.paymentMethods?.length ? user.paymentMethods : ["cod"]);
    setDefaultPaymentMethod(user?.defaultPaymentMethod || "cod");
  }, [user]);

  const absUrl = (url) =>
    !url ? "" : url.startsWith("http") ? url : `${API_BASE.replace(/\/api$/, "")}${url}`;

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  if (!token) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Bạn cần đăng nhập để xem tài khoản.</p>
        <Link to="/login" className="text-rose-600 dark:text-cyan-400 hover:underline mt-2 inline-block">
          Đi tới đăng nhập
        </Link>
      </div>
    );
  }

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setSaving(true);
    try {
      let nextAvatar = avatarUrl;
      if (avatarFile) {
        const data = new FormData();
        data.append("image", avatarFile);
        const up = await api.post("/uploads/avatar", data, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
        });
        nextAvatar = up.data.url;
      }
      const res = await api.put(
        "/auth/me",
        { name, phone, avatarUrl: nextAvatar, paymentMethods, defaultPaymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // keep token, update user locally
      login(token, { ...user, ...res.data });
      setAvatarFile(null);
      setMsg("Cập nhật thông tin thành công.");
    } catch (error) {
      setErr(error.response?.data?.message || "Không thể cập nhật thông tin.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setChanging(true);
    try {
      await api.post(
        "/auth/change-password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentPassword("");
      setNewPassword("");
      setMsg("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      logout();
    } catch (error) {
      setErr(error.response?.data?.message || "Không thể đổi mật khẩu.");
    } finally {
      setChanging(false);
    }
  };

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
      : "rounded-2xl border border-rose-200 bg-white p-4 sm:p-5 shadow-sm";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-rose-600 dark:hover:text-cyan-400">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700 dark:text-slate-200">Tài khoản</span>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tài khoản</h2>

      {(msg || err) && (
        <div
          className={
            "text-sm rounded-xl px-3 py-2 border " +
            (err
              ? "border-red-500/40 text-red-400 bg-red-500/10"
              : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10")
          }
        >
          {err || msg}
        </div>
      )}

      <div className={cardClass}>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Thông tin cá nhân</p>
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/40 shrink-0">
              {absUrl(avatarUrl) ? (
                <img src={absUrl(avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  AVT
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 dark:text-slate-400">Ảnh đại diện</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 dark:text-slate-400 mt-1"
              />
              <p className="text-[11px] text-slate-500 mt-1">png/jpg/webp • tối đa 5MB</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400">Email</label>
            <input value={user?.email || ""} disabled className={inputClass + " opacity-60"} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400">Họ tên</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400">Số điện thoại</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="VD: 09xxxxxxxx" />
          </div>
          <button
            type="submit"
            disabled={saving}
            className={
              "px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 " +
              (theme === "dark"
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                : "bg-rose-500 text-white hover:bg-rose-600")
            }
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>

      <div className={cardClass}>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Phương thức thanh toán
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Chọn phương thức mặc định. Bạn vẫn có thể đổi khi thanh toán.
        </p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {[
            { id: "cod", label: "COD (Thanh toán khi nhận hàng)" },
            { id: "bank_transfer", label: "Chuyển khoản ngân hàng" },
            { id: "momo", label: "Ví MoMo" },
            { id: "zalopay", label: "ZaloPay" }
          ].map((m) => (
            <label
              key={m.id}
              className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/30 p-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={paymentMethods.includes(m.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPaymentMethods((prev) => {
                    const next = checked ? Array.from(new Set([...prev, m.id])) : prev.filter((x) => x !== m.id);
                    const ensured = next.length ? next : ["cod"];
                    if (!ensured.includes(defaultPaymentMethod)) setDefaultPaymentMethod(ensured[0]);
                    return ensured;
                  });
                }}
              />
              <div className="min-w-0">
                <p className="text-slate-200">{m.label}</p>
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="radio"
                    name="defaultPayment"
                    checked={defaultPaymentMethod === m.id}
                    disabled={!paymentMethods.includes(m.id)}
                    onChange={() => setDefaultPaymentMethod(m.id)}
                  />
                  Mặc định
                </label>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
          Nhấn <span className="font-semibold">Lưu thay đổi</span> để cập nhật lựa chọn.
        </p>
      </div>

      <div className={cardClass}>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Đổi mật khẩu</p>
        <form onSubmit={changePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={changing}
            className={
              "px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 " +
              (theme === "dark"
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "bg-rose-100 text-rose-700 hover:bg-rose-200")
            }
          >
            {changing ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}

