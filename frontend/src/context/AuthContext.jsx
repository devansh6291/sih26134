import React, { createContext, useContext, useMemo, useState } from "react";
import { ROLE_HOME } from "../config/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("kaushalUser");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load saved user:", error);
      localStorage.removeItem("kaushalUser");
      return null;
    }
  });

  const login = (user) => {
    localStorage.setItem("kaushalUser", JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("kaushalUser");
    setCurrentUser(null);
  };

  const homePath = currentUser
    ? ROLE_HOME[currentUser.roleType] || "/"
    : "/login";

  const value = useMemo(
    () => ({
      currentUser,
      login,
      logout,
      homePath,
    }),
    [currentUser, homePath]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}