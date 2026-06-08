/**
 * components/AuthContext.jsx
 * React Context that provides auth state (user, login, logout) to the entire app.
 * Wrap the app in <AuthProvider> and consume with useContext(AuthContext) anywhere.
 */

import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// Convenience hook: useUser()
export function useUser() {
  return useContext(AuthContext);
}
