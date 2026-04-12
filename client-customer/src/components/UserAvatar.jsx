import { useTheme } from "../context/ThemeContext.jsx";
import { resolvePublicUrl } from "../utils/publicUrl.js";

function initialsFromName(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar khách hàng: ảnh URL hoặc chữ viết tắt tên.
 * @param {string} [src] — URL ảnh (đã resolve hoặc path /uploads/...)
 * @param {string} [name] — họ tên để hiển thị ký tự khi không có ảnh
 * @param {string} [sizeClass] — ví dụ "w-24 h-24" hoặc "w-9 h-9"
 * @param {string} [className] — thêm vào wrapper
 */
export default function UserAvatar({ src, name, sizeClass = "w-24 h-24", className = "" }) {
  const { theme } = useTheme();
  const url = src ? (src.startsWith("blob:") ? src : resolvePublicUrl(src)) : "";

  const ring =
    theme === "dark"
      ? "ring-2 ring-cyan-500/30 shadow-lg shadow-black/20"
      : "ring-2 ring-rose-200 shadow-md";

  const placeholderBg =
    theme === "dark"
      ? "bg-gradient-to-br from-slate-700 to-slate-900 text-cyan-200"
      : "bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700";

  const textSize = sizeClass.includes("w-9") || sizeClass.includes("w-8") ? "text-xs" : "text-lg";

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full overflow-hidden ${ring} ${className}`}
      aria-hidden={url ? undefined : true}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-semibold ${placeholderBg} ${textSize}`}
          title={name || ""}
        >
          {initialsFromName(name)}
        </div>
      )}
    </div>
  );
}
