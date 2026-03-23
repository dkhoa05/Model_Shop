import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";
import { getProductImageUrl } from "../../utils/productImage.js";
import { AVAILABILITY_LABELS } from "../../lib/productAvailability.js";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "0",
    category: "",
    brand: "",
    variantLabel: "",
    availability: "in_stock",
    description: ""
  });

  const inputClass =
    theme === "dark"
      ? "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setEditing(null);
    setImageFile(null);
    setForm({
      name: "",
      price: "",
      stock: "0",
      category: "",
      brand: "",
      variantLabel: "",
      availability: "in_stock",
      description: ""
    });
  };

  const uploadOneImage = async () => {
    if (!imageFile) return null;
    const data = new FormData();
    data.append("image", imageFile);
    const res = await api.post(`/uploads`, data, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const uploadedUrl = await uploadOneImage();
      const stockNum = Math.max(0, Math.floor(Number(form.stock) || 0));
      const payload = {
        ...form,
        price: Number(form.price),
        stock: stockNum,
        availability: form.availability || "in_stock",
        variantLabel: form.variantLabel?.trim() || "",
        images: uploadedUrl ? [uploadedUrl] : undefined
      };

      if (editing?._id) {
        await api.put(`/products/${editing._id}`, payload);
      } else {
        await api.post(`/products`, payload);
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu sản phẩm. Hãy kiểm tra token admin và dữ liệu.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa sản phẩm.");
    }
  };

  const startEdit = (p) => {
    setEditing(p);
    setImageFile(null);
    setForm({
      name: p.name || "",
      price: p.price ?? "",
      stock: p.stock != null ? String(p.stock) : "",
      category: p.category || "",
      brand: p.brand || "",
      variantLabel: p.variantLabel || "",
      availability: p.availability || "in_stock",
      description: p.description || ""
    });
  };


  if (!user || user.role !== "admin") {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        Bạn cần đăng nhập với tài khoản admin để truy cập trang này.
      </p>
    );
  }

  const cardClass =
    theme === "dark"
      ? "flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
      : "flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3 shadow-sm";

  return (
    <div className="grid md:grid-cols-[1.2fr,2fr] gap-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Quản lý mô hình / figure (Admin)
        </h2>
        {editing?._id && (
          <p className="text-xs text-rose-600 dark:text-cyan-300">
            Đang sửa: <span className="font-semibold">{editing.name}</span>
          </p>
        )}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Tên mô hình"
          className={inputClass}
          required
        />
        <input
          name="price"
          type="number"
          min="0"
          step="1"
          value={form.price}
          onChange={handleChange}
          placeholder="Giá (VND)"
          className={inputClass}
          required
        />
        <input
          name="stock"
          type="number"
          min="0"
          step="1"
          value={form.stock}
          onChange={handleChange}
          placeholder="Tồn kho (số lượng)"
          className={inputClass}
        />
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Loại (Anime, Figure, Gundam...)"
          className={inputClass}
          required
        />
        <input
          name="brand"
          value={form.brand}
          onChange={handleChange}
          placeholder="Hãng (Bandai, Good Smile...)"
          className={inputClass}
        />
        <input
          name="variantLabel"
          value={form.variantLabel}
          onChange={handleChange}
          placeholder="Phiên bản / quy cách (vd: scale 1/7, bản Exclusive, blind box series...)"
          className={inputClass}
        />
        <div className="space-y-1">
          <label className="text-xs text-slate-500 dark:text-slate-400">Tình trạng hàng</label>
          <select
            name="availability"
            value={form.availability}
            onChange={handleChange}
            className={inputClass}
          >
            {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Mô tả sản phẩm"
          className={inputClass + " min-h-[80px]"}
        />
        <div className="space-y-1">
          <label className="text-xs text-slate-500 dark:text-slate-400">
            Ảnh sản phẩm (jpeg/png/webp)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-500 dark:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className={
            "px-4 py-2 rounded-xl text-sm font-semibold transition " +
            (theme === "dark"
              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              : "bg-rose-500 text-white hover:bg-rose-600")
          }
        >
          {editing?._id ? "Lưu thay đổi" : "Thêm sản phẩm"}
        </button>
        {editing?._id && (
          <button
            type="button"
            onClick={resetForm}
            className={
              "ml-2 px-4 py-2 rounded-xl border text-sm transition " +
              (theme === "dark"
                ? "border-slate-700 hover:border-slate-500"
                : "border-rose-300 hover:border-rose-500")
            }
          >
            Hủy
          </button>
        )}
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Danh sách mô hình
        </h3>
        <div className="space-y-2 text-sm">
          {products.map((p) => (
            <div key={p._id} className={cardClass}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                  <img
                    src={getProductImageUrl(p)}
                    alt={p.name}
                    className="max-w-full max-h-full w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.category} • {p.price.toLocaleString("vi-VN")} ₫
                    {p.stock != null && (
                      <span className="text-slate-600 dark:text-slate-300">
                        {" "}
                        • Tồn: <span className="font-medium">{p.stock}</span>
                      </span>
                    )}
                    {p.availability && (
                      <span className="text-slate-500">
                        {" "}
                        • {AVAILABILITY_LABELS[p.availability] || p.availability}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startEdit(p)}
                  className="text-xs text-rose-600 dark:text-cyan-300 hover:underline"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
