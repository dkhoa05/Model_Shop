import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

export default function NotFoundPage() {
  const { theme } = useTheme();

  return (
    <div className="text-center py-16">
      <p className="text-8xl font-bold text-rose-200 dark:text-slate-700">404</p>
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-2">
        Không tìm thấy trang
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
        Trang bạn truy cập không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link
        to="/"
        className={
          "inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold transition " +
          (theme === "dark"
            ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            : "bg-rose-500 text-white hover:bg-rose-600")
        }
      >
        Về trang chủ
      </Link>
    </div>
  );
}
