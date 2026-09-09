import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import * as authApi from "@/api/auth";
import { setAccessToken, setAuthExpiredHandler, setAuthRefreshedHandler } from "@/api/client";
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from "@/lib/tokenStorage";
import type { AuthResponse, LoginRequest, RegisterRequest, Role } from "@/types/auth";

type AuthStatus = "booting" | "authenticated" | "unauthenticated";

interface AuthState {
  accessToken: string | null;
  role: Role | null;
  status: AuthStatus;
  sessionExpiredMessage: string | null;
  email: string | null;
  phone: string | null;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    role: null,
    status: "booting",
    sessionExpiredMessage: null,
    email: null,
    phone: null,
  });
  const refreshTokenAtBoot = useRef(getStoredRefreshToken());

  const applyAuthResponse = useCallback(
    (auth: AuthResponse, profile?: { email?: string; phone?: string }) => {
      setAccessToken(auth.accessToken);
      setStoredRefreshToken(auth.refreshToken);
      setState((prev) => ({
        accessToken: auth.accessToken,
        role: auth.role,
        status: "authenticated",
        sessionExpiredMessage: null,
        email: profile?.email ?? prev.email,
        phone: profile?.phone ?? prev.phone,
      }));
    },
    []
  );

  const clearSession = useCallback((sessionExpiredMessage: string | null) => {
    setAccessToken(null);
    clearStoredRefreshToken();
    setState({
      accessToken: null,
      role: null,
      status: "unauthenticated",
      sessionExpiredMessage,
      email: null,
      phone: null,
    });
  }, []);

  useEffect(() => {
    if (!refreshTokenAtBoot.current) {
      setState((prev) => ({ ...prev, status: "unauthenticated" }));
      return;
    }
    authApi
      .refresh({ refreshToken: refreshTokenAtBoot.current })
      .then((auth) => applyAuthResponse(auth))
      .catch(() => clearSession(null));
  }, []);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      clearSession("Your session expired — please log in again.");
    });
    setAuthRefreshedHandler((auth) => {
      setState((prev) => ({ ...prev, accessToken: auth.accessToken, role: auth.role }));
    });
    return () => {
      setAuthExpiredHandler(null);
      setAuthRefreshedHandler(null);
    };
  }, [clearSession]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const auth = await authApi.login(payload);
      applyAuthResponse(auth, { email: payload.email });
    },
    [applyAuthResponse]
  );

  const register = useCallback(async (payload: RegisterRequest) => {
    await authApi.register(payload);
    setState((prev) => ({ ...prev, email: payload.email, phone: payload.phone }));
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      await authApi.logout({ refreshToken }).catch(() => {});
    }
    clearSession(null);
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
