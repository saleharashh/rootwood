import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getStoredToken, setStoredToken, User } from "@/lib/api";
import { useToast } from "./toast-provider";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithPassword: (email: string, pass: string) => Promise<void>;
  registerWithPassword: (name: string, email: string, pass: string, phone?: string) => Promise<void>;
  sendOtp: (identifier: string) => Promise<{ code?: string; expiresInSeconds: number; message?: string }>;
  verifyOtp: (identifier: string, code: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api<User>("/auth/me");
      setUser(data);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const mergeCartAfterLogin = async () => {
    try {
      await api("/cart/merge", { method: "POST" });
    } catch {}
  };

  const loginWithPassword = async (email: string, pass: string) => {
    const res = await api<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });
    setStoredToken(res.accessToken);
    setUser(res.user);
    toast(`خوش آمدید، ${res.user.name}`, "success");
    await mergeCartAfterLogin();
  };

  const registerWithPassword = async (name: string, email: string, pass: string, phone?: string) => {
    const res = await api<{ accessToken: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password: pass, phone }),
    });
    setStoredToken(res.accessToken);
    setUser(res.user);
    toast("حساب کاربری با موفقیت ساخته شد", "success");
    await mergeCartAfterLogin();
  };

  const sendOtp = async (identifier: string) => {
    return api<{ success: boolean; message: string; code?: string; expiresInSeconds: number }>(
      "/auth/send-otp",
      {
        method: "POST",
        body: JSON.stringify({ identifier }),
      }
    );
  };

  const verifyOtp = async (identifier: string, code: string, name?: string) => {
    const res = await api<{ accessToken: string; user: User }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ identifier, code, name }),
    });
    setStoredToken(res.accessToken);
    setUser(res.user);
    toast(`خوش آمدید، ${res.user.name}`, "success");
    await mergeCartAfterLogin();
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    setStoredToken(null);
    setUser(null);
    toast("از حساب کاربری خارج شدید", "info");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        loginWithPassword,
        registerWithPassword,
        sendOtp,
        verifyOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
