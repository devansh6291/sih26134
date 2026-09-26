import React from "react";
import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="center-page">
      <div className="unauthorized-card">
        <ShieldX size={54} />
        <h1>Access restricted</h1>
        <p>Your current role does not have permission to view this workspace.</p>
        <Link to="/" className="primary-button">Return to workspace</Link>
      </div>
    </div>
  );
}