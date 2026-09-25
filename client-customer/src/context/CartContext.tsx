"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Product } from "@/types/product";
import { clampQuantity } from "@/utils/currency";
import { API_BASE, apiFetch } from "@/lib/api";
import { ApiProduct, mapApiProduct } from "@/lib/products";
import { CheckoutConfig, defaultCheckoutConfig } from "@/lib/checkoutConfig";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  wishlist: string[];
  cartNotice: CartItem | null;
  dismissCartNotice: () => void;
  /** Thông báo khi giỏ được đồng bộ lại theo giá/tồn kho mới nhất */
  syncNotices: string[];
  dismissSyncNotices: () => void;
  shippingConfig: CheckoutConfig;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_KEY = "model-shop-cart";
const WISHLIST_KEY = "model-shop-wishlist";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartNotice, setCartNotice] = useState<CartItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncNotices, setSyncNotices] = useState<string[]>([]);
  const [shippingConfig, setShippingConfig] = useState<CheckoutConfig>(defaultCheckoutConfig);
  const synced = useRef(false);

  useEffect(() => {
    setMounted(true);
    const storedCart = window.localStorage.getItem(CART_KEY);
    const storedWishlist = window.localStorage.getItem(WISHLIST_KEY);

    if (storedCart) {
      // Bỏ các dòng giỏ cũ có mã không phải ObjectId (dữ liệu mẫu cũ) — đặt hàng sẽ bị từ chối
      setCartItems(
        safeParse<CartItem[]>(storedCart, []).filter((item) => /^[a-f0-9]{24}$/i.test(String(item?.product?.id || "")))
      );
    }

    if (storedWishlist) {
      setWishlist(safeParse<string[]>(storedWishlist, []));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, mounted]);

  useEffect(() => {
    if (mounted) {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, mounted]);

  useEffect(() => {
    apiFetch<CheckoutConfig>("/payment-config/checkout")
      .then(setShippingConfig)
      .catch(() => undefined);
  }, []);

  // Đồng bộ giỏ với giá/tồn kho hiện tại một lần khi tải trang (giỏ lưu trong trình duyệt có thể đã cũ)
  useEffect(() => {
    if (!mounted || synced.current) return;
    synced.current = true;
    const snapshot = cartItems;
    if (snapshot.length === 0) return;

    (async () => {
      const notices: string[] = [];
      const next: CartItem[] = [];
      for (const item of snapshot) {
        try {
          const res = await fetch(`${API_BASE}/products/${item.product.id}`);
          if (res.status === 404 || res.status === 400) {
            notices.push(`"${item.product.name}" không còn được bán và đã được xóa khỏi giỏ.`);
            continue;
          }
          if (!res.ok) {
            next.push(item);
            continue;
          }
          const fresh = mapApiProduct((await res.json()) as ApiProduct);
          if (fresh.status === "out-of-stock" || fresh.stock <= 0) {
            notices.push(`"${fresh.name}" đã hết hàng và được xóa khỏi giỏ.`);
            continue;
          }
          let quantity = item.quantity;
          if (quantity > fresh.stock) {
            quantity = fresh.stock;
            notices.push(`"${fresh.name}" chỉ còn ${fresh.stock} sản phẩm, đã điều chỉnh số lượng.`);
          }
          if (fresh.price !== item.product.price) {
            notices.push(`Giá "${fresh.name}" đã thay đổi thành ${new Intl.NumberFormat("vi-VN").format(fresh.price)}₫.`);
          }
          next.push({ product: fresh, quantity });
        } catch {
          next.push(item); // lỗi mạng: giữ nguyên, server sẽ kiểm tra lại khi đặt hàng
        }
      }
      setCartItems((current) => {
        // giữ lại các món người dùng vừa thêm trong lúc đồng bộ
        const syncedIds = new Set(snapshot.map((i) => i.product.id));
        return [...next, ...current.filter((i) => !syncedIds.has(i.product.id))];
      });
      if (notices.length) setSyncNotices(notices);
    })();
  }, [mounted, cartItems]);

  const dismissSyncNotices = useCallback(() => setSyncNotices([]), []);
  const dismissCartNotice = useCallback(() => setCartNotice(null), []);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    if (product.status === "out-of-stock") {
      return;
    }

    const noticeItem = { product, quantity: clampQuantity(quantity, Math.max(product.stock, 99)) };
    setCartNotice(noticeItem);
    window.setTimeout(() => setCartNotice(null), 2600);

    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: clampQuantity(item.quantity + quantity, Math.max(product.stock, 99)) }
            : item
        );
      }

      return [...current, { product, quantity: clampQuantity(quantity, Math.max(product.stock, 99)) }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: clampQuantity(quantity, Math.max(item.product.stock, 99)) }
        : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((current) => current.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const shipping = subtotal === 0 || subtotal >= shippingConfig.freeShippingThreshold ? 0 : shippingConfig.shippingFlatFee;
  const total = subtotal + shipping;

  const value = useMemo(
    () => ({
      cartItems,
      cartNotice,
      syncNotices,
      dismissSyncNotices,
      shippingConfig,
      wishlist,
      addToCart,
      dismissCartNotice,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isInWishlist,
      subtotal,
      shipping,
      total
    }),
    [addToCart, cartItems, cartNotice, clearCart, dismissCartNotice, dismissSyncNotices, isInWishlist, removeFromCart, shipping, shippingConfig, subtotal, syncNotices, toggleWishlist, total, updateQuantity, wishlist]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
