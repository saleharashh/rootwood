import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, CartView } from "@/lib/api";
import { useToast } from "./toast-provider";

interface CartContextValue {
  cart: CartView | null;
  loading: boolean;
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  addItem: (productOrId: string | { id: string }, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isItemInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshCart = useCallback(async () => {
    try {
      const data = await api<CartView>("/cart");
      setCart(data);
    } catch {
      // Fallback empty cart
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productOrId: string | { id: string }, quantity = 1) => {
    const productId = typeof productOrId === "string" ? productOrId : productOrId.id;
    setLoading(true);
    try {
      const updated = await api<CartView>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(updated);
      toast("محصول به سبد خرید اضافه شد", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در افزودن به سبد خرید";
      toast(msg, "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(itemId);
    }
    try {
      const updated = await api<CartView>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در به‌روزرسانی تعداد";
      toast(msg, "error");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const updated = await api<CartView>(`/cart/items/${itemId}`, {
        method: "DELETE",
      });
      setCart(updated);
      toast("محصول از سبد خرید حذف شد", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در حذف محصول";
      toast(msg, "error");
    }
  };

  const clearCart = async () => {
    if (!cart?.items || cart.items.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        cart.items.map((item) =>
          api(`/cart/items/${item.id}`, { method: "DELETE" }).catch(() => {})
        )
      );
      await refreshCart();
      toast("سبد خرید خالی شد", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در خالی کردن سبد";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const isItemInCart = (productId: string) => {
    return !!cart?.items?.some((i) => i.productId === productId || i.product?.id === productId);
  };

  const getItemQuantity = (productId: string) => {
    const item = cart?.items?.find((i) => i.productId === productId || i.product?.id === productId);
    return item ? item.quantity : 0;
  };

  const itemCount = cart?.itemCount ?? cart?.summary?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? cart?.summary?.subtotal ?? 0;
  const shipping = cart?.shipping ?? cart?.summary?.shipping ?? 0;
  const total = cart?.total ?? cart?.summary?.total ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        subtotal,
        shipping,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isItemInCart,
        getItemQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
