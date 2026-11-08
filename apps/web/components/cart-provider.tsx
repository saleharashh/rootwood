"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addCartItem,
  clearCart,
  getCart,
  mergeCart,
  removeCartItem,
  updateCartItem,
  type Cart,
} from "@/lib/api";

const SESSION_COOKIE = "craftedroot_cart_session";

function getSessionId(): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1)) : null;
}

function setSessionId(id: string) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax${secure}`;
}

function clearSessionId() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function ensureSessionId(): string {
  const existing = getSessionId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  setSessionId(id);
  return id;
}

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  setAuthenticated: (authenticated: boolean) => void;
  mergeGuestCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const authenticatedRef = useRef(false);

  const setAuthenticated = useCallback((authenticated: boolean) => {
    authenticatedRef.current = authenticated;
  }, []);

  const activeSessionId = useCallback(() => {
    return authenticatedRef.current ? undefined : ensureSessionId();
  }, []);

  const loadCart = useCallback(async () => {
    const sessionId = getSessionId() ?? undefined;
    if (!sessionId && !authenticatedRef.current) {
      if (mountedRef.current) {
        setCart(null);
        setError(null);
      }
      return;
    }
    try {
      const data = await getCart(sessionId);
      if (mountedRef.current) {
        setCart(data);
        setError(null);
      }
    } catch {
      if (mountedRef.current) setError("بارگذاری سبد خرید ممکن نشد");
    }
  }, []);

  const mergeGuestCart = useCallback(async () => {
    if (!authenticatedRef.current) return;
    const sessionId = getSessionId();
    if (!sessionId) {
      await loadCart();
      return;
    }
    setRefreshing(true);
    try {
      const data = await mergeCart(sessionId);
      if (mountedRef.current) {
        setCart(data);
        setError(null);
      }
      clearSessionId();
    } catch {
      await loadCart();
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [loadCart]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(loadCart).finally(() => {
      if (mountedRef.current) setLoading(false);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [loadCart]);

  const runMutation = useCallback(async (operation: () => Promise<Cart>) => {
    setRefreshing(true);
    try {
      const data = await operation();
      if (mountedRef.current) {
        setCart(data);
        setError(null);
      }
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, []);

  const addItem = useCallback(
    (productId: string, quantity = 1) =>
      runMutation(() => addCartItem(productId, quantity, activeSessionId())),
    [activeSessionId, runMutation],
  );

  const updateItem = useCallback(
    (itemId: string, quantity: number) =>
      runMutation(() => updateCartItem(itemId, quantity, activeSessionId())),
    [activeSessionId, runMutation],
  );

  const removeItem = useCallback(
    (itemId: string) =>
      runMutation(() => removeCartItem(itemId, activeSessionId())),
    [activeSessionId, runMutation],
  );

  const clear = useCallback(
    () => runMutation(() => clearCart(activeSessionId())),
    [activeSessionId, runMutation],
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshing,
        error,
        loadCart,
        addItem,
        updateItem,
        removeItem,
        clear,
        setAuthenticated,
        mergeGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart باید داخل CartProvider استفاده شود");
  return ctx;
}
