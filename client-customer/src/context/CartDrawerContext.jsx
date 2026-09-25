import { createContext, useCallback, useContext, useRef, useState } from "react";

const CartDrawerContext = createContext(null);

export function CartDrawerProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [cartTick, setCartTick] = useState(0);
  /** Nút “Giỏ hàng” trên header — căn mini-cart dropdown */
  const cartButtonRef = useRef(null);

  const openCart = useCallback(() => {
    setCartTick((t) => t + 1);
    setOpen(true);
  }, []);

  const closeCart = useCallback(() => setOpen(false), []);

  const notifyCartChanged = useCallback(() => {
    setCartTick((t) => t + 1);
  }, []);

  return (
    <CartDrawerContext.Provider
      value={{ open, openCart, closeCart, notifyCartChanged, cartTick, cartButtonRef }}
    >
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error("useCartDrawer cần CartDrawerProvider");
  return ctx;
}
