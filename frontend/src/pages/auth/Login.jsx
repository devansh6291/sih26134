import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, TrendingUp, Users, BrainCircuit } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME, ROLE_LABELS } from "../../config/roles";

const roles = Object.keys(ROLE_LABELS);

export default function Login() {
  const [role, setRole] = useState("policyOfficer");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const names = {
      candidate: "Aarav Sharma",
      recruiter: "Priya Mehta",
      trainer: "Rohan Verma",
      instituteAdmin: "Neha Singh",
      policyOfficer: "Ananya Kapoor"
    };

    login({
      userId: `${role}-demo`,
      fullName: names[role],
      email: `${role}@kaushal.demo`,
      roleType: role
    });

    navigate(ROLE_HOME[role]);
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="visual-grid" />
        <div className="login-brand">
          <div className="brand-mark large">K</div>
          <div><strong>KAUSHAL</strong><small>Labour Market Intelligence</small></div>
        </div>

        <div className="visual-copy">
          <span className="eyebrow">SKILL INTELLIGENCE PLATFORM</span>
          <h1>Turn industry signals into <span>job-ready skills.</span></h1>
          <p>
            Connect demand, skills, curriculum, training capacity and placement
            outcomes in one evidence-driven platform.
          </p>

          <div className="visual-features">
            <div><TrendingUp /> <span>Demand intelligence</span></div>
            <div><BrainCircuit /> <span>Skill-gap mapping</span></div>
            <div><Users /> <span>Employer validation</span></div>
          </div>
        </div>
      </div>

      <motion.div
        className="login-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-mark">K</div>
            <strong>KAUSHAL</strong>
          </div>

          <span className="eyebrow dark">WELCOME BACK</span>
          <h2>Sign in to your workspace</h2>
          <p className="login-muted">Select a role to preview the RBAC interface.</p>

          <form onSubmit={submit}>
            <label>Email</label>
            <input type="email" defaultValue={`${role}@kaushal.demo`} />

            <label>Password</label>
            <input type="password" defaultValue="demo1234" />

            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>

            <button className="primary-button full" type="submit">
              Enter workspace <ArrowRight size={18} />
            </button>
          </form>

          <div className="security-note">
            <ShieldCheck size={17} />
            <span>RBAC-protected workspace • Demo frontend</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}