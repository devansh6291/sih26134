import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import Login from "../pages/auth/Login";
import Unauthorized from "../pages/Unauthorized";

import DashboardLayout from "../components/layout/DashboardLayout";
import RoleDashboard from "../pages/RoleDashboard";
import ModulePage from "../pages/ModulePage";

import CandidateJobs from "../pages/candidate/CandidateJobs";
import CandidateSkillGap from "../pages/candidate/CandidateSkillGap";
import CandidateCourses from "../pages/candidate/CandidateCourses";

import RecruiterJobs from "../pages/recruiter/RecruiterJobs";
import RecruiterApplicants from "../pages/recruiter/RecruiterApplicants";
import PlacementFeedback from "../pages/recruiter/PlacementFeedback";

const roleRoutes = [
  {
    role: "candidate",
    base: "/candidate",
    dashboard: "/candidate/dashboard",
    modules: []
  },
  {
    role: "recruiter",
    base: "/recruiter",
    dashboard: "/recruiter/dashboard",
    modules: []
  },
  {
    role: "trainer",
    base: "/trainer",
    dashboard: "/trainer/dashboard",
    modules: [
      ["modules", "Assigned Modules"],
      ["alerts", "Upskill Alerts"],
      ["resources", "Training Resources"],
      ["evaluations", "Evaluation Queue"]
    ]
  },
  {
    role: "instituteAdmin",
    base: "/institute",
    dashboard: "/institute/dashboard",
    modules: [
      ["courses", "Courses"],
      ["curriculum", "Curriculum"],
      ["trainers", "Trainers"],
      ["capacity", "Training Capacity"],
      ["equipment", "Equipment"],
      ["district-plan", "District Plan"]
    ]
  },
  {
    role: "policyOfficer",
    base: "/policy",
    dashboard: "/policy/dashboard",
    modules: [
      ["labour-market", "Labour Market"],
      ["forecast", "Demand Forecast"],
      ["skills", "Skill Gaps"],
      ["courses", "Course Analysis"],
      ["districts", "District Reports"],
      ["reports", "Policy Reports"]
    ]
  }
];

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          {roleRoutes.map(({ role, base, dashboard, modules }) => (
            <Route
              key={role}
              element={<RoleRoute allowedRoles={[role]} />}
            >
              <Route element={<DashboardLayout />}>
                <Route
                  path={dashboard.slice(1)}
                  element={<RoleDashboard role={role} />}
                />

                {modules.map(([slug, title]) => (
                  <Route
                    key={slug}
                    path={`${base.slice(1)}/${slug}`}
                    element={
                      <ModulePage
                        title={title}
                        role={role}
                      />
                    }
                  />
                ))}

                {role === "candidate" && (
                  <>
                    <Route
                      path="candidate/jobs"
                      element={<CandidateJobs />}
                    />
                    <Route
                      path="candidate/skill-gap"
                      element={<CandidateSkillGap />}
                    />
                    <Route
                      path="candidate/courses"
                      element={<CandidateCourses />}
                    />
                  </>
                )}

                {role === "recruiter" && (
                  <>
                    <Route
                      path="recruiter/jobs"
                      element={<RecruiterJobs />}
                    />
                    <Route
                      path="recruiter/candidates"
                      element={<RecruiterApplicants />}
                    />
                    <Route
                      path="recruiter/feedback"
                      element={<PlacementFeedback />}
                    />
                  </>
                )}
              </Route>
            </Route>
          ))}
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}