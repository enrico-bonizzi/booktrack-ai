import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthApi } from "../services/api";
import type { User } from "../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "booktrack.token";
const USER_KEY = "booktrack.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [loading, setLoading] = useState(false);

  // Revalida o token no boot (caso tenha expirado)
  useEffect(() => {
    if (!token) return;
    AuthApi.me()
      .then(setUser)
      .catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loginWithGoogle(idToken: string) {
    setLoading(true);
    try {
      const res = await AuthApi.googleLogin(idToken);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
