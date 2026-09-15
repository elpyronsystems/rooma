import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "../api/types";
import * as authApi from "../api/auth";

interface AuthContextValue {
  user: User | null;
  login: (identifier: string, password: string) => Promise<User>;
  loginWithOAuth: (provider: "google" | "microsoft", idToken: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    const loggedInUser = await authApi.login(identifier, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const loginWithOAuth = useCallback(async (provider: "google" | "microsoft", idToken: string) => {
    const loggedInUser = await authApi.oauthLogin(provider, idToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  // Fired by the API client when a silent token refresh fails (refresh
  // token itself expired/invalid) — reflects the now-logged-out state in
  // the UI without needing every page to handle this individually.
  useEffect(() => {
    function handleAuthExpired() {
      setUser(null);
    }
    window.addEventListener("rooma:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("rooma:auth-expired", handleAuthExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithOAuth, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
