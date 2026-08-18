import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { clearSession, getStoredUser, getToken, saveSession, saveUser } from "@/lib/authStorage";
import { LEGACY_ROLE_KEY } from "@/lib/authStorage";
import { serverRoleFor, type LoginRole } from "@/lib/faculty";
import type { AuthUser } from "@/types/faculty";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (role: LoginRole, identifier: string, password: string) => Promise<AuthUser>;
  logout: () => void;
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
        const res = await api.get<{ user: AuthUser }>("/auth/me");
        setUser(res.user);
        saveUser(res.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void restore();
  }, []);

  const login = async (role: LoginRole, identifier: string, password: string): Promise<AuthUser> => {
    const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      role: serverRoleFor(role),
      identifier,
      password,
    });
    saveSession(res.token, res.user);
    // legacy key used by the public site pages (UpdatesPage, NoticeBoardPage)
    localStorage.setItem(LEGACY_ROLE_KEY, role);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const refresh = async () => {
    if (!getToken()) return;
    try {
      const res = await api.get<{ user: AuthUser }>("/auth/me");
      setUser(res.user);
      saveUser(res.user);
    } catch {
      // session likely expired
      clearSession();
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}