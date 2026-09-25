import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Phiên đăng nhập nằm trong cookie httpOnly do server cấp → không lưu token ở JS/localStorage
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});
