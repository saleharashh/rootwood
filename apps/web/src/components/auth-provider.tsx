import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getStoredToken, setStoredToken, User } from "@/lib/api";
import { isPlaceholderUserName } from "@/lib/validation";
import { useToast } from "./toast-provider";

export interface VerifyOtpResult {
  user: User;
  isNewUser?: boolean;
  profileComplete?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  sendOtp: (phone: string) => Promise<{ code?: string; expiresInSeconds: number; message?: string }>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<VerifyOtpResult>;
  adminLogin: (phone: string, password: string) => Promise<VerifyOtpResult>;
  updateProfile: (name: string, email?: string) => Promise<User>;
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

  const sendOtp = async (phone: string) => {
    return api<{ success: boolean; message: string; code?: string; expiresInSeconds: number }>(
      "/auth/send-otp",
      {
        method: "POST",
        body: JSON.stringify({ identifier: phone, phone }),
      }
    );
  };

  const verifyOtp = async (phone: string, code: string, name?: string): Promise<VerifyOtpResult> => {
    const res = await api<{
      accessToken: string;
      user: User;
      isNewUser?: boolean;
      profileComplete?: boolean;
    }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ identifier: phone, phone, code, name }),
    });
    setStoredToken(res.accessToken);
    setUser(res.user);
    toast(`خوش آمدید، ${res.user.name}`, "success");
    return {
      user: res.user,
      isNewUser: res.isNewUser,
      profileComplete: res.profileComplete ?? !isPlaceholderUserName(res.user.name),
    };
  };

  /**
   * Temporary manager login with an allowlisted admin phone + password.
   * Used until the SMS/OTP panel is connected.
   */
  const adminLogin = async (phone: string, password: string): Promise<VerifyOtpResult> => {
    const res = await api<{
      accessToken: string;
      user: User;
      isNewUser?: boolean;
      profileComplete?: boolean;
    }>("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ identifier: phone, phone, password }),
    });
    setStoredToken(res.accessToken);
    setUser(res.user);
    toast(`خوش آمدید، ${res.user.name}`, "success");
    return {
      user: res.user,
      isNewUser: res.isNewUser,
      profileComplete: res.profileComplete ?? !isPlaceholderUserName(res.user.name),
    };
  };

  const updateProfile = async (name: string, email?: string): Promise<User> => {
    const payload: { name: string; email?: string } = { name };
    if (email !== undefined) {
      payload.email = email;
    }
    const res = await api.updateProfile(payload);
    setUser(res.user);
    toast(res.message || "اطلاعات کاربری با موفقیت ثبت شد", "success");
    return res.user;
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    setStoredToken(null);
    setUser(null);
    toast("از حساب کاربری خارج شدید", "info");
  };

  const isProfileComplete = !!user && !isPlaceholderUserName(user.name);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isProfileComplete,
        sendOtp,
        verifyOtp,
        adminLogin,
        updateProfile,
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
