"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "@/data/products";
import { clampQuantity } from "@/utils/currency";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  wishlist: string[];
  cartNotice: CartItem | null;
  dismissCartNotice: () => void;
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

  useEffect(() => {
    setMounted(true);
    const storedCart = window.localStorage.getItem(CART_KEY);
    const storedWishlist = window.localStorage.getItem(WISHLIST_KEY);

    if (storedCart) {
      setCartItems(safeParse<CartItem[]>(storedCart, []));
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
  const shipping = subtotal === 0 || subtotal >= 2000000 ? 0 : 35000;
  const total = subtotal + shipping;

  const value = useMemo(
    () => ({
      cartItems,
      cartNotice,
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
    [addToCart, cartItems, cartNotice, clearCart, dismissCartNotice, isInWishlist, removeFromCart, shipping, subtotal, toggleWishlist, total, updateQuantity, wishlist]
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
