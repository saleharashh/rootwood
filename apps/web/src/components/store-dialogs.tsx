import React, { createContext, useContext, useState } from "react";
import { AuthDialog } from "./auth-dialog";
import { CartDialog } from "./cart-dialog";

interface StoreDialogsContextValue {
  openAuth: () => void;
  closeAuth: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const StoreDialogsContext = createContext<StoreDialogsContextValue | null>(null);

export function StoreDialogsProvider({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const openAuth = () => setAuthOpen(true);
  const closeAuth = () => setAuthOpen(false);
  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  return (
    <StoreDialogsContext.Provider value={{ openAuth, closeAuth, openCart, closeCart }}>
      {children}
      <AuthDialog open={authOpen} onClose={closeAuth} />
      <CartDialog open={cartOpen} onClose={closeCart} />
    </StoreDialogsContext.Provider>
  );
}

export function useStoreDialogs() {
  const ctx = useContext(StoreDialogsContext);
  if (!ctx) throw new Error("useStoreDialogs must be used within StoreDialogsProvider");
  return ctx;
}
