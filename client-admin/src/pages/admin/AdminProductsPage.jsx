import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";
import { getProductImageUrl } from "../../utils/productImage.js";
import { AVAILABILITY_LABELS } from "../../lib/productAvailability.js";

const SERVER_ORIGIN = (import.meta.env.VITE_API_BASE || "http://localhost:5000/api")
  .replace(/\/api\/?$/, "");

const toAbsUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};

const makeGalleryId = () => `g-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** @typedef {{ id: string, kind: 'existing', url: string } | { id: string, kind: 'new', file: File, objectUrl: string }} GalleryItem */

const thumbBtn = "absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600";
const reorderCol =
  "absolute left-0.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5";

/** Ô gõ + danh sách gợi ý trông giống select Tình trạng hàng (viền cyan, chevron, panel tối, highlight xanh) */
function AdminSuggestCombo({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  required,
  suggestions,
  inputClass,
  theme
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    const q = String(value || "").trim().toLowerCase();
    const list = suggestions || [];
    if (!q) return list;
    return list.filter((s) => String(s).toLowerCase().includes(q));
  }, [suggestions, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const listClass =
    theme === "dark"
      ? "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-600 bg-slate-800 py-1 shadow-xl"
      : "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-rose-200 bg-white py-1 shadow-lg";

  const itemClass = (picked) => {
    if (theme === "dark") {
      return (
        "px-3 py-2.5 text-sm cursor-pointer transition-colors " +
        (picked
          ? "bg-blue-600 text-white font-medium"
          : "text-slate-100 hover:bg-blue-600 hover:text-white")
      );
    }
    return (
      "px-3 py-2.5 text-sm cursor-pointer transition-colors " +
      (picked
        ? "bg-rose-600 text-white font-medium"
        : "text-slate-800 hover:bg-rose-100")
    );
  };

  return (
    <div className="space-y-1" ref={wrapRef}>
      <label htmlFor={id} className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          autoComplete="off"
          value={value}
          required={required}
          placeholder={placeholder}
          className={inputClass + " pr-10"}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          tabIndex={-1}
          className={
            "absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 outline-none focus-visible:ring-2 " +
            (theme === "dark"
              ? "text-slate-200 hover:text-white focus-visible:ring-cyan-400"
              : "text-slate-600 hover:text-rose-700 focus-visible:ring-rose-400")
          }
          onClick={() => setOpen((o) => !o)}
          aria-label="Mở danh sách gợi ý"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && filtered.length > 0 ? (
          <ul className={listClass} role="listbox">
            {filtered.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={opt === value}
                className={itemClass(opt === value)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onValueChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  /** Thứ tự ảnh: xen kẽ ảnh đã lưu và ảnh mới chọn */
  const [galleryItems, setGalleryItems] = useState(/** @type {GalleryItem[]} */ ([]));
  const fileInputRef = useRef(null);
  const galleryRef = useRef(/** @type {GalleryItem[]} */ ([]));

  const revokeNewPreviews = (items) => {
    items.forEach((it) => {
      if (it.kind === "new") URL.revokeObjectURL(it.objectUrl);
    });
  };

  useEffect(() => {
    galleryRef.current = galleryItems;
  }, [galleryItems]);

  useEffect(() => {
    return () => revokeNewPreviews(galleryRef.current);
  }, []);

  const [listSearch, setListSearch] = useState("");
  /** Thông báo trong trang (thay alert — trình duyệt có thể chặn popup) */
  const [formNotice, setFormNotice] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    cost: "",
    stock: "",
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

  const filteredProducts = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const blob = [p.name, p.category, p.brand, p.variantLabel, p.description]
        .map((s) => String(s || "").toLowerCase())
        .join(" ");
      return blob.includes(q);
    });
  }, [products, listSearch]);

  /** Gợi ý từ dữ liệu đã có — vẫn gõ được giá trị mới (input + datalist) */
  const categorySuggestions = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const c = String(p.category || "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [products]);

  const brandSuggestions = useMemo(() => {
    const set = new Set();
    for (const p of products) {
      const b = String(p.brand || "").trim();
      if (b) set.add(b);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [products]);

  useEffect(() => {
    if (!formNotice) return;
    const id = window.setTimeout(() => setFormNotice(""), 6000);
    return () => window.clearTimeout(id);
  }, [formNotice]);

  const handleChange = (e) => {
    setFormNotice("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormNotice("");
    setEditing(null);
    setGalleryItems((prev) => {
      revokeNewPreviews(prev);
      return [];
    });
    setForm({
      name: "",
      price: "",
      cost: "",
      stock: "",
      category: "",
      brand: "",
      variantLabel: "",
      availability: "in_stock",
      description: ""
    });
  };

  const handleFilesChange = (e) => {
    setFormNotice("");
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: makeGalleryId(),
        kind: "new",
        file,
        objectUrl: URL.createObjectURL(file)
      }))
    ]);
    e.target.value = "";
  };

  const removeGalleryItem = (id) => {
    setFormNotice("");
    setGalleryItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.kind === "new") URL.revokeObjectURL(it.objectUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const moveGalleryItem = (id, delta) => {
    setFormNotice("");
    setGalleryItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      if (i < 0) return prev;
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const buildImageUrlsInOrder = async () => {
    const urls = [];
    for (const item of galleryItems) {
      if (item.kind === "existing") {
        urls.push(item.url);
      } else {
        const data = new FormData();
        data.append("image", item.file);
        const res = await api.post(`/uploads`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        urls.push(res.data.url);
      }
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editing?._id) {
        const nameNorm = form.name.trim().toLowerCase();
        if (!nameNorm) {
          setFormNotice("Nhập tên mô hình.");
          return;
        }
        const duplicate = products.some(
          (p) => String(p.name || "").trim().toLowerCase() === nameNorm
        );
        if (duplicate) {
          setFormNotice("Hàng đã có trong kho.");
          return;
        }
      }

      const allImages = await buildImageUrlsInOrder();
      const stockNum = Math.max(0, Math.floor(Number(form.stock) || 0));
      const payload = {
        ...form,
        price: Number(form.price),
        cost: Number(form.cost) || 0,
        stock: stockNum,
        availability: form.availability || "in_stock",
        variantLabel: form.variantLabel?.trim() || "",
        images:
          allImages.length > 0 ? allImages : editing?._id ? [] : undefined
      };

      if (editing?._id) {
        await api.put(`/products/${editing._id}`, payload);
      } else {
        await api.post(`/products`, payload);
      }

      setFormNotice("");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      setFormNotice("Lỗi khi lưu sản phẩm. Hãy kiểm tra token admin và dữ liệu.");
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
    setFormNotice("");
    setEditing(p);
    setGalleryItems((prev) => {
      revokeNewPreviews(prev);
      return (p.images || []).map((url) => ({
        id: makeGalleryId(),
        kind: "existing",
        url
      }));
    });
    setForm({
      name: p.name || "",
      price: p.price ?? "",
      cost: p.cost ?? "",
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
      <div className="space-y-3 min-w-0">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Quản lý mô hình / figure (Admin)
        </h2>
        {formNotice ? (
          <div
            role="alert"
            className={
              "rounded-xl border px-3 py-2.5 text-sm font-medium flex items-start justify-between gap-2 " +
              (theme === "dark"
                ? "border-amber-400/60 bg-amber-500/15 text-amber-100"
                : "border-rose-300 bg-rose-50 text-rose-900")
            }
          >
            <span className="min-w-0 flex-1">{formNotice}</span>
            <button
              type="button"
              onClick={() => setFormNotice("")}
              className={
                "shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold " +
                (theme === "dark"
                  ? "text-amber-200 hover:bg-amber-500/20"
                  : "text-rose-800 hover:bg-rose-100")
              }
              aria-label="Đóng thông báo"
            >
              Đóng
            </button>
          </div>
        ) : null}
      <form onSubmit={handleSubmit} className="space-y-3">
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
          placeholder="Giá bán (VND)"
          className={inputClass}
          required
        />
        <input
          name="cost"
          type="number"
          min="0"
          step="1"
          value={form.cost}
          onChange={handleChange}
          placeholder="Giá vốn (VND) — dùng tính giá vốn hàng bán"
          className={inputClass}
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
        <AdminSuggestCombo
          id="admin-product-category"
          label="Loại (danh mục) — chọn gợi ý hoặc gõ mới"
          value={form.category}
          onValueChange={(v) => {
            setFormNotice("");
            setForm((f) => ({ ...f, category: v }));
          }}
          placeholder="Anime, Figure, Gundam..."
          required
          suggestions={categorySuggestions}
          inputClass={inputClass}
          theme={theme}
        />
        <AdminSuggestCombo
          id="admin-product-brand"
          label="Hãng — chọn gợi ý hoặc gõ mới"
          value={form.brand}
          onValueChange={(v) => {
            setFormNotice("");
            setForm((f) => ({ ...f, brand: v }));
          }}
          placeholder="Bandai, Good Smile..."
          required={false}
          suggestions={brandSuggestions}
          inputClass={inputClass}
          theme={theme}
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
          <div className="relative">
            <select
              name="availability"
              value={form.availability}
              onChange={handleChange}
              className={inputClass + " appearance-none cursor-pointer pr-10"}
            >
              {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <svg
              className={
                "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 " +
                (theme === "dark" ? "text-slate-200" : "text-slate-600")
              }
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Mô tả sản phẩm"
          className={inputClass + " min-h-[80px]"}
        />
         <div className="space-y-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">
            Ảnh sản phẩm — chọn nhiều ảnh (jpeg/png/webp). Thứ tự = thứ tự hiển thị (ảnh đầu = ảnh chính).
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleFilesChange}
            className="w-full text-xs text-slate-500 dark:text-slate-400"
          />

          {galleryItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-400">
                Thứ tự ảnh ({galleryItems.length}) — dùng ↑ ↓ để đổi chỗ
              </p>
              <div className="flex flex-wrap gap-2">
                {galleryItems.map((item, idx) => {
                  const src = item.kind === "existing" ? toAbsUrl(item.url) : item.objectUrl;
                  const border =
                    item.kind === "existing"
                      ? "border border-slate-700"
                      : "border border-cyan-500/40";
                  return (
                    <div
                      key={item.id}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden ${border}`}
                    >
                      <div className={reorderCol}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveGalleryItem(item.id, -1)}
                          className="w-4 h-4 rounded bg-slate-900/85 text-[10px] text-white leading-none disabled:opacity-30 hover:bg-slate-700"
                          title="Lên trước"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === galleryItems.length - 1}
                          onClick={() => moveGalleryItem(item.id, 1)}
                          className="w-4 h-4 rounded bg-slate-900/85 text-[10px] text-white leading-none disabled:opacity-30 hover:bg-slate-700"
                          title="Xuống sau"
                        >
                          ↓
                        </button>
                      </div>
                      <img src={src} alt="" className="w-full h-full object-cover pl-5" />
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(item.id)}
                        className={thumbBtn}
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 px-1 rounded bg-black/60 text-[9px] text-white">
                          Chính
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
      </div>

       <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 shrink-0">
            Danh sách mô hình
          </h3>
          <input
            type="search"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            placeholder="Tìm theo tên, loại, hãng..."
            className={inputClass + " sm:max-w-[16rem] w-full"}
            aria-label="Tìm trong danh sách mô hình"
          />
        </div>
        <div className="space-y-2 text-sm">
          {filteredProducts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              {products.length === 0
                ? "Chưa có mô hình nào."
                : "Không có mô hình khớp tìm kiếm."}
            </p>
          ) : null}
          {filteredProducts.map((p) => (
            <div key={p._id} className={cardClass}>
              <div className="flex items-center gap-3 min-w-0">
                {/* Hiển thị tối đa 3 ảnh thu nhỏ */}
                <div className="flex gap-1 shrink-0">
                  {(p.images?.length ? p.images : [getProductImageUrl(p)])
                    .slice(0, 3)
                    .map((img, i) => (
                      <div key={i}
                        className="w-12 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <img src={toAbsUrl(img)} alt={`${p.name || "product"} ${i + 1}`}
                          className="w-full h-full object-contain" />
                      </div>
                    ))}
                  {p.images?.length > 3 && (
                    <div className="w-12 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                      +{p.images.length - 3}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.category} • {p.price.toLocaleString("vi-VN")} ₫
                    {p.stock != null && (
                      <span className="text-slate-600 dark:text-slate-300">
                        {" "}• Tồn: <span className="font-medium">{p.stock}</span>
                      </span>
                    )}
                    {p.availability && (
                      <span> • {AVAILABILITY_LABELS[p.availability] || p.availability}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => startEdit(p)}
                  className="text-xs text-rose-600 dark:text-cyan-300 hover:underline">Sửa</button>
                <button onClick={() => handleDelete(p._id)}
                  className="text-xs text-red-500 hover:text-red-600">Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
