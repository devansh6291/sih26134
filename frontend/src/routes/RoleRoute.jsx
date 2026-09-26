import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allowedRoles }) {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  return allowedRoles.includes(currentUser.roleType)
    ? <Outlet />
    : <Navigate to="/unauthorized" replace />;
}