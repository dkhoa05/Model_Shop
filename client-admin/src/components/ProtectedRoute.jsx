import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, token, authReady } = useAuth();
  const location = useLocation();

  if (token && !authReady) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-8" role="status">
        Đang xác thực phiên đăng nhập…
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (requireAdmin && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}

