/**
 * hooks/useAuth.js
 * Custom hook: useAuth
 * Manages authentication state for the entire app.
 *
 * Returns:
 *   - user: current session user object or null
 *   - loading: true while checking session on mount
 *   - login(username, password): calls POST /api/auth/login, sets user
 *   - logout(): calls POST /api/auth/logout, clears user
 */

import { useState, useEffect } from "react";
import api from "../api/index.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if a session already exists when app loads
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return { user, loading, login, logout };
}
