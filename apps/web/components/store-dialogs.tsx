"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { CartDialog } from "@/components/cart-dialog";

type ActiveDialog = "cart" | "auth" | null;

interface StoreDialogsValue {
  openCart: () => void;
  openAuth: (options?: { redirect?: string }) => void;
  close: () => void;
}

const StoreDialogsContext = createContext<StoreDialogsValue | null>(null);

const DEFAULT_AUTH_REDIRECT = "/account";

export function StoreDialogsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [authRedirect, setAuthRedirect] = useState(DEFAULT_AUTH_REDIRECT);

  const openCart = useCallback(() => setActiveDialog("cart"), []);
  const close = useCallback(() => setActiveDialog(null), []);
  const openAuth = useCallback((options?: { redirect?: string }) => {
    setAuthRedirect(options?.redirect ?? DEFAULT_AUTH_REDIRECT);
    setActiveDialog("auth");
  }, []);

  const requireAuthForCheckout = useCallback(() => {
    setAuthRedirect("/checkout");
    setActiveDialog("auth");
  }, []);

  const value = useMemo(
    () => ({ openCart, openAuth, close }),
    [openCart, openAuth, close],
  );

  return (
    <StoreDialogsContext.Provider value={value}>
      {children}
      <CartDialog
        open={activeDialog === "cart"}
        onClose={close}
        onRequireAuth={requireAuthForCheckout}
      />
      <AuthDialog
        open={activeDialog === "auth"}
        onClose={close}
        redirect={authRedirect}
      />
    </StoreDialogsContext.Provider>
  );
}

export function useStoreDialogs() {
  const ctx = useContext(StoreDialogsContext);
  if (!ctx) {
    throw new Error("useStoreDialogs باید داخل StoreDialogsProvider استفاده شود");
  }
  return ctx;
}
