import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const storageKey = "eduvantaAuth";

const getStoredAuth = () => {
  try {
    const rawData = localStorage.getItem(storageKey);
    return rawData ? JSON.parse(rawData) : null;
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getStoredAuth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const storedAuth = getStoredAuth();

      if (!storedAuth?.token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        const nextAuth = { ...storedAuth, user: data.user };
        localStorage.setItem(storageKey, JSON.stringify(nextAuth));
        setAuth(nextAuth);
      } catch (error) {
        localStorage.removeItem(storageKey);
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const nextAuth = { token: data.token, user: data.user };
    localStorage.setItem(storageKey, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    setAuth(null);
  };

  const updateUser = (updatedUser) => {
    const nextAuth = { ...auth, user: updatedUser };
    localStorage.setItem(storageKey, JSON.stringify(nextAuth));
    setAuth(nextAuth);
  };

  return (
    <AuthContext.Provider value={{ auth, user: auth?.user || null, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
