import { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "../services/api";

const AuthContext = createContext(null);
const storageKey = "mns-auth";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey) || "");
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);

    if (!token) {
      setUser(null);
      setIsAuthLoading(false);
      return;
    }

    api
      .getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem(storageKey);
        setAuthToken("");
        setToken("");
        setUser(null);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, [token]);

  const login = async (email, password) => {
    const result = await api.login({ email, password });
    localStorage.setItem(storageKey, result.token);
    setAuthToken(result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    setAuthToken("");
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isAuthLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
