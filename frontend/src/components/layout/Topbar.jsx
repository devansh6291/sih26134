import React from "react";
import { Bell, Search, UserCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../config/roles";

export default function Topbar() {
  const { currentUser } = useAuth();

  return (
    <header className="topbar">
      <div className="top-search">
        <Search size={18} />
        <input placeholder="Search skills, jobs, courses..." />
      </div>

      <div className="top-actions">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="profile">
          <div className="avatar">{currentUser?.fullName?.charAt(0) || "U"}</div>
          <div>
            <strong>{currentUser?.fullName}</strong>
            <small>{ROLE_LABELS[currentUser?.roleType]}</small>
          </div>
        </div>
      </div>
    </header>
  );
}