import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/layout.css";

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-area">
        <Topbar />
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}