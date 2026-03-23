import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";
import { resolvePublicUrl } from "../../utils/publicUrl.js";

export default function AdminPaymentConfigPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    bankName: "",
    bankAccount: "",
    accountHolder: "",
    qrImageUrl: "",
    momoPhone: "",
    zalopayPhone: ""
  });
  const [qrFile, setQrFile] = useState(null);

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
      : "rounded-2xl border border-rose-200 bg-white p-4 sm:p-5 shadow-sm";

  useEffect(() => {
    api
      .get("/admin/payment-config")
      .then((res) => {
        const d = res.data;
        setForm({
          bankName: d.bankName || "",
          bankAccount: d.bankAccount || "",
          accountHolder: d.accountHolder || "",
          qrImageUrl: d.qrImageUrl || "",
          momoPhone: d.momoPhone || "",
          zalopayPhone: d.zalopayPhone || ""
        });
      })
      .catch(() => setMsg("Không tải được cấu hình."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      let qrUrl = form.qrImageUrl;
      if (qrFile) {
        const data = new FormData();
        data.append("image", qrFile);
        const up = await api.post("/uploads", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        qrUrl = up.data.url;
      }
      await api.put("/admin/payment-config", {
        bankName: form.bankName.trim(),
        bankAccount: form.bankAccount.trim(),
        accountHolder: form.accountHolder.trim(),
        qrImageUrl: qrUrl.trim(),
        momoPhone: form.momoPhone.trim(),
        zalopayPhone: form.zalopayPhone.trim()
      });
      setForm((f) => ({ ...f, qrImageUrl: qrUrl }));
      setQrFile(null);
      setMsg("Đã lưu cấu hình thanh toán.");
    } catch (err) {
      setMsg(err.response?.data?.message || "Không lưu được.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải cấu hình...</p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Cấu hình thanh toán
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Nhập số tài khoản ngân hàng, ảnh mã QR chuyển khoản và số điện thoại ví MoMo/ZaloPay. Nội dung này sẽ hiển thị cho khách khi thanh toán đơn hàng.
      </p>

      {msg && (
        <div
          className={
            "text-sm rounded-xl px-3 py-2 " +
            (msg.includes("lưu") && !msg.includes("Không")
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-amber-500/30 bg-amber-500/10 text-amber-200")
          }
        >
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className={cardClass + " space-y-4"}>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Chuyển khoản ngân hàng
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Tên ngân hàng
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                placeholder="VD: Vietcombank"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Số tài khoản (STK)
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.bankAccount}
                onChange={(e) => setForm((f) => ({ ...f, bankAccount: e.target.value }))}
                placeholder="VD: 0123456789"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Chủ tài khoản
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.accountHolder}
                onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
                placeholder="VD: MODEL SHOP"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Ảnh mã QR chuyển khoản
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-sm text-slate-600 dark:text-slate-300"
                  onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                />
                {form.qrImageUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={resolvePublicUrl(form.qrImageUrl)}
                      alt="QR"
                      className="h-20 w-20 max-w-full object-contain rounded-lg border border-slate-600"
                    />
                    <span className="text-xs text-slate-500">Ảnh hiện tại</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tải ảnh QR lên hoặc giữ ảnh cũ. Khách sẽ quét mã này để chuyển khoản.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 dark:border-slate-700 pt-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Ví điện tử
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                SĐT nhận MoMo
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.momoPhone}
                onChange={(e) => setForm((f) => ({ ...f, momoPhone: e.target.value }))}
                placeholder="VD: 0900123456"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                SĐT nhận ZaloPay
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.zalopayPhone}
                onChange={(e) => setForm((f) => ({ ...f, zalopayPhone: e.target.value }))}
                placeholder="VD: 0900123456"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={
              "px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 " +
              (theme === "dark"
                ? "bg-cyan-600 text-white hover:bg-cyan-500"
                : "bg-rose-600 text-white hover:bg-rose-700")
            }
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </form>
    </div>
  );
}
