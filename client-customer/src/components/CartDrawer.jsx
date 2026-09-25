import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCartDrawer } from "../context/CartDrawerContext.jsx";
import { getCartItemsSafe } from "../lib/cartStorage.js";

const DROPDOWN_MAX_W = 380;
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=128&q=80";

export default function CartDrawer() {
  const { open, closeCart, notifyCartChanged, cartTick, cartButtonRef } = useCartDrawer();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [layout, setLayout] = useState({ top: 80, left: 16, arrowLeft: DROPDOWN_MAX_W / 2, panelW: DROPDOWN_MAX_W });
  const ignoreBackdropCloseRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    ignoreBackdropCloseRef.current = true;
    const id = window.setTimeout(() => {
      ignoreBackdropCloseRef.current = false;
    }, 400);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setItems(getCartItemsSafe());
  }, [open, cartTick]);

  const updatePosition = useCallback(() => {
    const vw = window.innerWidth;
    const inner = Math.max(0, vw - 16);
    const panelW = Math.min(DROPDOWN_MAX_W, Math.max(240, inner));
    const rect = cartButtonRef?.current?.getBoundingClientRect();
    const maxLeft = Math.max(8, vw - panelW - 8);
    const left = rect
      ? Math.min(Math.max(8, rect.left + rect.width / 2 - panelW / 2), maxLeft)
      : Math.max(8, vw - panelW - 16);
    const top = rect ? rect.bottom + 10 : 80;
    const buttonCenterX = rect ? rect.left + rect.width / 2 : left + panelW / 2;
    const arrowLeft = Math.min(Math.max(20, buttonCenterX - left), panelW - 20);
    setLayout({ top, left, arrowLeft, panelW });
  }, [cartButtonRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, cartTick, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeCart]);

  const updateCart = (next) => {
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
    notifyCartChanged();
  };

  const handleQuantityChange = (productId, delta) => {
    const next = items
      .map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + delta } : i
      )
      .filter((i) => i.quantity > 0);
    updateCart(next);
  };

  const handleRemove = (productId) => {
    updateCart(items.filter((i) => i.productId !== productId));
  };

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  const total = items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={
          "fixed inset-0 z-[100] transition-opacity duration-200 " +
          (open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
        }
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/25"
          onClick={() => {
            if (ignoreBackdropCloseRef.current) return;
            closeCart();
          }}
          aria-label="Đóng giỏ hàng"
        />
        <div
          className={
            "fixed z-[101] rounded-md border border-slate-300 bg-white text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.12)] transition-all duration-200 " +
            (open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none")
          }
          style={{
            top: layout.top,
            left: layout.left,
            width: layout.panelW
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mini-cart-title"
        >
          {/* Mũi tên trỏ lên nút Giỏ hàng */}
          <div
            className="absolute -top-[7px] z-10 h-0 w-0 border-x-[8px] border-b-[8px] border-x-transparent border-b-white"
            style={{ left: layout.arrowLeft - 8 }}
          />
          <div
            className="absolute -top-[9px] z-[9] h-0 w-0 border-x-[9px] border-b-[9px] border-x-transparent border-b-slate-300"
            style={{ left: layout.arrowLeft - 9 }}
          />

          <div className="relative bg-white overflow-hidden">
            <header className="px-4 pt-3 pb-2 border-b border-slate-200">
              <h2
                id="mini-cart-title"
                className="text-center text-[15px] font-bold tracking-wide text-slate-900 uppercase"
              >
                Giỏ hàng
              </h2>
            </header>

            {!items.length ? (
              <div className="px-4 py-6 text-center text-sm text-slate-600">
                <p className="mb-4">Chưa có sản phẩm trong giỏ.</p>
                <button
                  type="button"
                  onClick={() => {
                    closeCart();
                    navigate("/cart");
                  }}
                  className="inline-flex min-w-[160px] justify-center rounded-sm bg-[#2563eb] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#1d4ed8] transition"
                >
                  Xem giỏ hàng
                </button>
              </div>
            ) : (
              <>
                <div className="max-h-[min(50vh,340px)] overflow-y-auto px-4 divide-y divide-slate-100">
                  {items.map((item) => {
                    const line =
                      (Number(item.price) || 0) * (Number(item.quantity) || 1);
                    const img = item.imageUrl || PLACEHOLDER_IMG;
                    return (
                      <div key={item.productId} className="flex gap-3 py-3">
                        <img
                          src={img}
                          alt=""
                          className="h-[72px] w-[72px] shrink-0 rounded-sm border border-slate-200 object-cover bg-slate-50"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1 flex flex-col">
                          <div className="flex justify-between gap-2 items-start min-h-[2.5rem]">
                            <p
                              className="text-[13px] font-medium leading-snug text-[#1d4ed8] line-clamp-2 pr-1"
                              title={item.name}
                            >
                              {item.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemove(item.productId)}
                              className="shrink-0 -mt-0.5 text-base font-light leading-none text-slate-900 hover:text-red-600 w-6 h-6 flex items-center justify-center"
                              aria-label="Xóa"
                            >
                              ×
                            </button>
                          </div>
                          {item.variantLabel ? (
                            <p className="text-[11px] text-slate-500 mb-0.5">{item.variantLabel}</p>
                          ) : null}
                          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                            <div className="inline-flex items-stretch rounded-sm border border-slate-400 text-sm bg-white">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, -1)}
                                className="w-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 border-r border-slate-400"
                              >
                                −
                              </button>
                              <span className="min-w-[2.25rem] flex items-center justify-center tabular-nums text-slate-900 font-medium">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, 1)}
                                className="w-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 border-l border-slate-400"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[15px] font-bold text-[#dc2626] tabular-nums shrink-0">
                              {line.toLocaleString("vi-VN")}₫
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 bg-slate-50/80">
                  <span className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
                    Tổng tiền:
                  </span>
                  <span className="text-lg font-bold text-[#dc2626] tabular-nums">
                    {total.toLocaleString("vi-VN")}₫
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeCart();
                      navigate("/cart");
                    }}
                    className="rounded-sm bg-[#2563eb] py-3 text-center text-[11px] font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#1d4ed8] active:bg-blue-800 transition"
                  >
                    Xem giỏ hàng
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="rounded-sm border-2 border-[#2563eb] bg-white py-[10px] text-[11px] font-bold uppercase tracking-wide text-[#2563eb] hover:bg-blue-50 active:bg-blue-100 transition"
                  >
                    Thanh toán
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
