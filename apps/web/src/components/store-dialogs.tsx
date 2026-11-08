import React, { createContext, useContext, useState } from "react";
import { AuthDialog } from "./auth-dialog";
import { CartDialog } from "./cart-dialog";
import { SearchDialog } from "./search-dialog";

interface StoreDialogsContextValue {
  openAuth: (initialMode?: "signin" | "signup" | "otp") => void;
  openAuthDialog: (initialMode?: "signin" | "signup" | "otp") => void;
  closeAuth: () => void;
  closeAuthDialog: () => void;
  openCart: () => void;
  openCartDialog: () => void;
  closeCart: () => void;
  closeCartDialog: () => void;
  openSearch: () => void;
  openSearchDialog: () => void;
  closeSearch: () => void;
  closeSearchDialog: () => void;
}

const StoreDialogsContext = createContext<StoreDialogsContextValue | null>(null);

export function StoreDialogsProvider({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "otp">("signin");
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const openAuth = (mode: "signin" | "signup" | "otp" = "signin") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const closeAuth = () => setAuthOpen(false);

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  return (
    <StoreDialogsContext.Provider
      value={{
        openAuth,
        openAuthDialog: openAuth,
        closeAuth,
        closeAuthDialog: closeAuth,
        openCart,
        openCartDialog: openCart,
        closeCart,
        closeCartDialog: closeCart,
        openSearch,
        openSearchDialog: openSearch,
        closeSearch,
        closeSearchDialog: closeSearch,
      }}
    >
      {children}
      <AuthDialog open={authOpen} mode={authMode} setMode={setAuthMode} onClose={closeAuth} />
      <CartDialog open={cartOpen} onClose={closeCart} />
      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </StoreDialogsContext.Provider>
  );
}

export function useStoreDialogs() {
  const ctx = useContext(StoreDialogsContext);
  if (!ctx) throw new Error("useStoreDialogs must be used within StoreDialogsProvider");
  return ctx;
}
