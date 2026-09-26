import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  MapPinned,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/dashboard/StatCard";
import { ROLE_LABELS } from "../config/roles";
import {
  getCandidateGuidance,
  getIntelligenceOverview,
} from "../services/api";

const roleCopy = {
  candidate: {
    title: "Career guidance",
    subtitle: "Explore local demand and the skills that can strengthen your career path.",
  },
  recruiter: {
    title: "Employer intelligence",
    subtitle: "Connect hiring signals, employer validation and placement outcomes.",
  },
  trainer: {
    title: "Trainer workspace",
    subtitle: "Keep learning content aligned with emerging employer requirements.",
  },
  instituteAdmin: {
    title: "Institute operations",
    subtitle: "Plan courses, capacity, equipment and trainer development against demand.",
  },
  policyOfficer: {
    title: "Policy intelligence",
    subtitle: "Translate evidence from industry into district-level training action.",
  },
};

function formatValue(value, suffix = "") {
  if (value === null || value === undefined) return "Not reported";
  return `${value}${suffix}`;
}

export default function RoleDashboard({ role }) {
  const { currentUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const copy = roleCopy[role] || roleCopy.policyOfficer;

  const refresh = useCallback(async () => {
    setError("");
    try {
      const results = await Promise.all([
        getIntelligenceOverview(),
        role === "candidate" ? getCandidateGuidance() : Promise.resolve(null),
      ]);
      setOverview(results[0]);
      setGuidance(results[1]);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 30000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const stats = overview
    ? [
        [
          "Evidence signals",
          overview.totalSignals,
          "Job, employer, industry and technology evidence",
          Activity,
          "blue",
        ],
        [
          "High-demand skills",
          overview.topSkills?.length || 0,
          "Skills ranked by recorded demand",
          TrendingUp,
          "teal",
        ],
        [
          "Courses under review",
          overview.coursesByStatus?.under_review || 0,
          "Curriculum updates needing review",
          GraduationCap,
          "orange",
        ],
        [
          "Reported placements",
          overview.placementsReported,
          overview.placementRate == null
            ? "Placement rate not reported"
            : `${overview.placementRate}% reported placement rate`,
          CheckCircle2,
          "green",
        ],
      ]
    : [];

  if (role === "instituteAdmin" && overview) {
    stats[1] = [
      "Training seats",
      overview.trainingSeats,
      `${overview.trainerCount} trainers recorded`,
      Users,
      "teal",
    ];
    stats[2] = [
      "Districts covered",
      overview.districtsCovered,
      "District capacity records",
      Building2,
      "orange",
    ];
  }

  if (role === "recruiter" && overview) {
    stats[1] = [
      "Employer validations",
      overview.signalsBySource?.employer_survey || 0,
      "Employer survey signals recorded",
      Users,
      "teal",
    ];
    stats[2] = [
      "Employer rating",
      formatValue(overview.averageEmployerRating, "/5"),
      "Average reported employer rating",
      Award,
      "orange",
    ];
  }

  if (role === "candidate" && currentUser) {
    stats[0] = [
      "Readiness score",
      formatValue(currentUser.readiness, "%"),
      "Based on your saved candidate profile",
      Activity,
      "blue",
    ];
    stats[1] = [
      "Priority skill gaps",
      guidance?.prioritySkillGaps?.length ?? "—",
      "Derived from recorded demand in your location",
      AlertTriangle,
      "orange",
    ];
    stats[2] = [
      "Recommended courses",
      guidance?.recommendedCourses?.length ?? "—",
      "Matched to your current skill profile",
      GraduationCap,
      "teal",
    ];
  }

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="eyebrow dark">{ROLE_LABELS[role]} WORKSPACE</span>
          <h1>{role === "candidate" && currentUser?.fullName
            ? `Welcome, ${currentUser.fullName}`
            : copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="date-pill"><MapPinned size={16} /> Evidence-led view</div>
      </motion.div>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {loading && <p role="status">Loading current platform evidence...</p>}

      {overview && (
        <>
          <div className="stats-grid">
            {stats.map(([title, value, change, Icon, tone]) => (
              <StatCard
                key={title}
                title={title}
                value={value}
                change={change}
                icon={Icon}
                tone={tone}
              />
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="chart-card wide">
              <div className="card-heading">
                <div>
                  <h3>Skills with recorded demand</h3>
                  <p>Aggregated from stored job, employer, industry and technology signals.</p>
                </div>
                <TrendingUp size={18} />
              </div>
              {overview.topSkills?.length ? overview.topSkills.map((skill) => (
                <div className="list-row" key={skill.skillName}>
                  <span>{skill.skillName}</span>
                  <span className="badge success">
                    {skill.demandValue} demand · {skill.signalCount} signals
                  </span>
                </div>
              )) : <p>No labour-market signals have been submitted yet.</p>}
            </section>

            <section className="chart-card">
              <div className="card-heading">
                <div>
                  <h3>Roles in the evidence base</h3>
                  <p>Highest weighted demand signals.</p>
                </div>
                <BriefcaseBusiness size={18} />
              </div>
              {overview.topRoles?.length ? overview.topRoles.map((item) => (
                <div className="list-row" key={item.roleTitle}>
                  <span>{item.roleTitle}</span>
                  <strong>{item.demandValue}</strong>
                </div>
              )) : <p>No role demand data recorded yet.</p>}
            </section>

            <section className="chart-card">
              <div className="card-heading">
                <div>
                  <h3>Demand by location</h3>
                  <p>Demand signals grouped by reported district or location.</p>
                </div>
                <MapPinned size={18} />
              </div>
              {overview.topLocations?.length ? overview.topLocations.map((item) => (
                <div className="list-row" key={item.location}>
                  <span>{item.location}</span>
                  <strong>{item.demandValue}</strong>
                </div>
              )) : <p>No location demand data recorded yet.</p>}
            </section>

            <section className="chart-card">
              <div className="card-heading">
                <div>
                  <h3>Demand by proficiency</h3>
                  <p>Requested skill levels across recorded signals.</p>
                </div>
                <TrendingUp size={18} />
              </div>
              {overview.proficiencyLevels?.length ? overview.proficiencyLevels.map((item) => (
                <div className="list-row" key={item.proficiencyLevel}>
                  <span>{item.proficiencyLevel}</span>
                  <strong>{item.demandValue}</strong>
                </div>
              )) : <p>No proficiency demand data recorded yet.</p>}
            </section>

            <section className="chart-card wide">
              <div className="card-heading">
                <div>
                  <h3>Curriculum and placement evidence</h3>
                  <p>Use these measures to guide review; validate changes with employers.</p>
                </div>
                <BookOpen size={18} />
              </div>
              <div className="list-row">
                <span>Active courses</span>
                <strong>{overview.coursesByStatus?.active || 0}</strong>
              </div>
              <div className="list-row">
                <span>Courses requiring review</span>
                <strong>{overview.coursesByStatus?.under_review || 0}</strong>
              </div>
              <div className="list-row">
                <span>Courses marked obsolete</span>
                <strong>{overview.coursesByStatus?.obsolete || 0}</strong>
              </div>
              <div className="list-row">
                <span>Courses marked oversupplied</span>
                <strong>{overview.coursesByStatus?.oversupplied || 0}</strong>
              </div>
              <div className="list-row">
                <span>Employer satisfaction</span>
                <strong>{formatValue(overview.averageEmployerRating, "/5")}</strong>
              </div>
            </section>

            {role === "candidate" && guidance && (
              <>
                <section className="chart-card">
                  <div className="card-heading">
                    <div><h3>Priority skill gaps</h3><p>Demanded skills missing from your profile.</p></div>
                  </div>
                  {guidance.prioritySkillGaps?.length
                    ? guidance.prioritySkillGaps.map((skill) => (
                      <div className="list-row" key={skill}>
                        <span>{skill}</span><span className="badge warning">Opportunity</span>
                      </div>
                    ))
                    : <p>No priority skill gaps found in current local evidence.</p>}
                </section>
                <section className="chart-card">
                  <div className="card-heading">
                    <div><h3>Course pathways</h3><p>Active courses covering priority gaps.</p></div>
                  </div>
                  {guidance.recommendedCourses?.length
                    ? guidance.recommendedCourses.map((course) => (
                      <div className="list-row" key={course.courseId}>
                        <span>{course.courseName}</span>
                        <small>{course.matchingSkills.join(", ")}</small>
                      </div>
                    ))
                    : <p>No matching courses are currently recorded.</p>}
                </section>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
