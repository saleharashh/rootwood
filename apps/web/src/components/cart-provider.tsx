import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api, CartView } from "@/lib/api";
import { FREE_SHIPPING_FALLBACK } from "@/lib/commerce";
import { useAuth } from "./auth-provider";
import { useToast } from "./toast-provider";

interface CartContextValue {
  cart: CartView | null;
  loading: boolean;
  initialLoading: boolean;
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const lastUserId = useRef<string | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch {
      // Keep the last known cart on transient failures.
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Whenever the signed-in user changes, merge the guest cart once and reload.
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (user && lastUserId.current !== user.id) {
        try {
          await api("/cart/merge", { method: "POST" });
        } catch {
          // A missing guest cart is not an error.
        }
      }
      lastUserId.current = user?.id ?? null;
      if (!cancelled) await refreshCart();
    };

    sync();
    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshCart]);

  const addItem = async (productOrId: string | { id: string }, quantity = 1) => {
    const productId = typeof productOrId === "string" ? productOrId : productOrId.id;
    setLoading(true);
    try {
      await api<CartView>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      await refreshCart();
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
      await api(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در به‌روزرسانی تعداد";
      toast(msg, "error");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api(`/cart/items/${itemId}`, { method: "DELETE" });
      await refreshCart();
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
      for (const item of cart.items) {
        try {
          await api(`/cart/items/${item.id}`, { method: "DELETE" });
        } catch {
          // Continue clearing the remaining items.
        }
      }
      await refreshCart();
      toast("سبد خرید خالی شد", "info");
    } finally {
      setLoading(false);
    }
  };

  const isItemInCart = (productId: string) =>
    !!cart?.items?.some((i) => i.productId === productId || i.product?.id === productId);

  const getItemQuantity = (productId: string) => {
    const item = cart?.items?.find(
      (i) => i.productId === productId || i.product?.id === productId
    );
    return item ? item.quantity : 0;
  };

  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;
  const freeShippingThreshold = cart?.summary?.freeShippingThreshold ?? FREE_SHIPPING_FALLBACK;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        initialLoading,
        itemCount,
        subtotal,
        shipping,
        total,
        freeShippingThreshold,
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
