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
  ApiError,
  getCurrentUser,
  login,
  logout,
  register,
  sendOtp,
  verifyOtp,
  type AuthUser,
  type SendOtpResult,
} from "@/lib/api";
import { useCart } from "@/components/cart-provider";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOtp: (identifier: string, code: string, name?: string) => Promise<void>;
  requestOtp: (identifier: string) => Promise<SendOtpResult>;
  signUp: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const { setAuthenticated, mergeGuestCart, loadCart } = useCart();

  const refreshUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      if (mountedRef.current) setUser(current);
    } catch (error) {
      if (mountedRef.current && error instanceof ApiError && error.status === 401) {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    localStorage.removeItem("craftedroot_token");
    void Promise.resolve().then(refreshUser).finally(() => {
      if (mountedRef.current) setLoading(false);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    setAuthenticated(Boolean(user));
    if (user) {
      void mergeGuestCart().catch(() => undefined);
    } else {
      void loadCart();
    }
  }, [user, setAuthenticated, mergeGuestCart, loadCart]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await login({ email, password });
    setAuthenticated(true);
    await mergeGuestCart();
    setUser(result.user);
  }, [mergeGuestCart, setAuthenticated]);

  const requestOtp = useCallback(async (identifier: string) => {
    return sendOtp(identifier);
  }, []);

  const signInWithOtp = useCallback(
    async (identifier: string, code: string, name?: string) => {
      const result = await verifyOtp({ identifier, code, name });
      setAuthenticated(true);
      await mergeGuestCart();
      setUser(result.user);
    },
    [mergeGuestCart, setAuthenticated],
  );

  const signUp = useCallback(
    async (data: { email: string; password: string; name: string; phone?: string }) => {
      const result = await register(data);
      setAuthenticated(true);
      await mergeGuestCart();
      setUser(result.user);
    },
    [mergeGuestCart, setAuthenticated],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setAuthenticated(false);
      setUser(null);
      await loadCart();
    }
  }, [loadCart, setAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithOtp,
        requestOtp,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth باید داخل AuthProvider استفاده شود");
  return ctx;
}
