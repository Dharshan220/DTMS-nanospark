import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession, getStoredUser, getToken, saveSession, saveUser } from "@/lib/authStorage";
import { LEGACY_ROLE_KEY } from "@/lib/authStorage";
import type { AuthUser } from "@/types/faculty";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const restore = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<AuthUser>("/auth/me");
        setUser(res);
        saveUser(res);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void restore();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post<{ user: AuthUser; accessToken: string }>(
      "/auth/login",
      { email, password }
    );
    saveSession(res.accessToken, res.user);
    const role = res.user.role === "FACULTY" ? "faculty" : res.user.role === "ADMIN" ? "admin" : "student";
    localStorage.setItem(LEGACY_ROLE_KEY, role);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout errors
    }
    clearSession();
    setUser(null);
  };

  const refresh = async () => {
    if (!getToken()) return;
    try {
      const res = await api.get<AuthUser>("/auth/me");
      setUser(res);
      saveUser(res);
    } catch {
      clearSession();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
