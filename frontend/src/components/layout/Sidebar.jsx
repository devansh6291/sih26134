import React from "react";
import { NavLink } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NAVIGATION } from "../../config/navigation";
import { ROLE_LABELS } from "../../config/roles";

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const items = NAVIGATION[currentUser?.roleType] || [];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">K</div>
        <div>
          <strong>KAUSHAL</strong>
          <small>Skill Intelligence</small>
        </div>
      </div>

      <div className="role-chip">
        <span className="online-dot" />
        {ROLE_LABELS[currentUser?.roleType]}
      </div>

      <nav className="sidebar-nav">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-link">
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button className="nav-link logout-link" onClick={logout}>
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}