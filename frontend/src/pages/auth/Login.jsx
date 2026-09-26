import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME, ROLE_LABELS } from "../../config/roles";
import {
  getCurrentUser,
  loginWithPassword,
  registerAccount,
} from "../../services/api";

const roleValues = {
  candidate: "candidate",
  recruiter: "recruiter",
  trainer: "trainer",
  instituteAdmin: "institute_admin",
  policyOfficer: "policy_officer",
};

export default function Login() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const tokenResponse = mode === "register"
        ? await registerAccount({
            email,
            password,
            fullName,
            roleType: roleValues[role],
            orgName: company,
            locationPref: location,
            skills: skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean),
          })
        : await loginWithPassword(email, password);

      localStorage.setItem("kaushalToken", tokenResponse.accessToken);
      const user = await getCurrentUser();
      const roleAliases = {
        institute_admin: "instituteAdmin",
        policy_officer: "policyOfficer",
      };
      const roleType = roleAliases[user.roleType] || user.roleType;
      const authenticatedUser = { ...user, roleType };

      login(authenticatedUser, tokenResponse.accessToken);
      navigate(ROLE_HOME[roleType] || "/unauthorized");
    } catch (loginError) {
      localStorage.removeItem("kaushalToken");
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
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
          <h2>{mode === "login" ? "Sign in to your workspace" : "Create your account"}</h2>
          <p className="login-muted">
            {mode === "login"
              ? "Sign in to your KAUSHAL account."
              : "Create a KAUSHAL account to get started."}
          </p>

          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                <label>Full name</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={255}
                  required
                />

                <label>Role</label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                {role === "recruiter" && (
                  <>
                    <label>Company / organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      maxLength={255}
                    />
                  </>
                )}

                {role === "candidate" && (
                  <>
                    <label>Preferred location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      maxLength={100}
                    />

                    <label>Skills</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(event) => setSkills(event.target.value)}
                      placeholder="React, JavaScript, Node.js"
                    />
                    <small>Separate skills with commas.</small>
                  </>
                )}
              </>
            )}

            <label>Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={mode === "register" ? 8 : undefined}
              required
            />

            {error && <p role="alert" className="login-error">{error}</p>}

            <button
              className="primary-button full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "login" ? "Signing in..." : "Creating account..."
                : mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight size={18} />
            </button>
          </form>

          <button
            type="button"
            className="login-mode-toggle"
            onClick={() => {
              setMode((currentMode) =>
                currentMode === "login" ? "register" : "login"
              );
              setError("");
            }}
          >
            {mode === "login"
              ? "New to KAUSHAL? Create an account"
              : "Already have an account? Sign in"}
          </button>

          <div className="security-note">
            <ShieldCheck size={17} />
            <span>Role-protected workspace</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}