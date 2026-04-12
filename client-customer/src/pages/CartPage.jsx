import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartContents from "../components/CartContents.jsx";
import { useCartDrawer } from "../context/CartDrawerContext.jsx";
import { getCartItemsSafe } from "../lib/cartStorage.js";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const { notifyCartChanged, cartTick } = useCartDrawer();

  useEffect(() => {
    setItems(getCartItemsSafe());
  }, [cartTick]);

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

  return (
    <CartContents
      items={items}
      onQuantityChange={handleQuantityChange}
      onRemove={handleRemove}
      onCheckout={() => navigate("/checkout")}
    />
  );
}
