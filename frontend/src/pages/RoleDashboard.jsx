import React from "react";
import {
  Activity, BriefcaseBusiness, Users, BrainCircuit, GraduationCap,
  Building2, TrendingUp, AlertTriangle, CheckCircle2, MapPinned
} from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "../components/dashboard/StatCard";
import { DemandChart, SkillChart, GapChart } from "../components/dashboard/Charts";
import { ROLE_LABELS } from "../config/roles";

const dashboardData = {
  candidate: {
    title: "Good morning, Aarav",
    subtitle: "Your career readiness and next-step recommendations.",
    stats: [
      ["Readiness score", "74%", "+6.2% this month", Activity, "blue"],
      ["Skill gaps", "7", "3 critical", BrainCircuit, "orange"],
      ["Recommended courses", "12", "4 high relevance", GraduationCap, "teal"],
      ["Credits earned", "68", "+12 this term", CheckCircle2, "green"]
    ]
  },
  recruiter: {
    title: "Employer intelligence",
    subtitle: "Monitor hiring demand, candidates and skill availability.",
    stats: [
      ["Active jobs", "42", "+9 this month", BriefcaseBusiness, "blue"],
      ["Candidates", "1,284", "+18.4%", Users, "teal"],
      ["Critical skills", "18", "5 hard-to-fill", BrainCircuit, "orange"],
      ["Placements", "78.4%", "+6.8%", CheckCircle2, "green"]
    ]
  },
  trainer: {
    title: "Trainer workspace",
    subtitle: "Keep training modules aligned with emerging industry needs.",
    stats: [
      ["Assigned modules", "8", "2 need updates", GraduationCap, "blue"],
      ["Upskill alerts", "5", "2 critical", AlertTriangle, "orange"],
      ["Evaluations", "24", "8 pending", Activity, "teal"],
      ["Learners", "186", "+12 this month", Users, "green"]
    ]
  },
  instituteAdmin: {
    title: "Institute operations",
    subtitle: "Manage courses, curriculum, trainers and training capacity.",
    stats: [
      ["Active courses", "34", "4 under review", GraduationCap, "blue"],
      ["Trainer capacity", "78%", "+4.1%", Users, "teal"],
      ["Equipment readiness", "64%", "6 gaps flagged", Building2, "orange"],
      ["Placement rate", "81.2%", "+7.4%", CheckCircle2, "green"]
    ]
  },
  policyOfficer: {
    title: "Policy intelligence",
    subtitle: "Translate labour-market signals into district-level training action.",
    stats: [
      ["Active job roles", "12,482", "+14.2%", BriefcaseBusiness, "blue"],
      ["Emerging skills", "48", "+8 new", TrendingUp, "teal"],
      ["Skill gaps", "126", "18 critical", BrainCircuit, "orange"],
      ["Placement rate", "78.4%", "+6.8%", CheckCircle2, "green"]
    ]
  }
};

export default function RoleDashboard({ role }) {
  const d = dashboardData[role];

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="eyebrow dark">{ROLE_LABELS[role]} WORKSPACE</span>
          <h1>{d.title}</h1>
          <p>{d.subtitle}</p>
        </div>
        <div className="date-pill"><MapPinned size={16} /> India • 2026</div>
      </motion.div>

      <div className="stats-grid">
        {d.stats.map(([title, value, change, Icon, tone]) => (
          <StatCard key={title} title={title} value={value} change={change} icon={Icon} tone={tone} />
        ))}
      </div>

      {role === "candidate" ? <CandidatePanels /> :
       role === "recruiter" ? <RecruiterPanels /> :
       role === "trainer" ? <TrainerPanels /> :
       role === "instituteAdmin" ? <InstitutePanels /> :
       <PolicyPanels />}
    </div>
  );
}

function CandidatePanels() {
  return (
    <div className="dashboard-grid">
      <div className="wide"><CareerReadiness /></div>
      <div><SkillGapList /></div>
      <div className="wide"><DemandChart /></div>
      <div><Recommended /></div>
    </div>
  );
}

function CareerReadiness() {
  return (
    <div className="chart-card readiness-card">
      <div className="card-heading"><div><h3>Career readiness</h3><p>Based on declared and inferred skills</p></div><span className="score-circle">74</span></div>
      <div className="progress-track"><div className="progress-fill" style={{width:"74%"}} /></div>
      <div className="readiness-row"><span>Technical skills</span><strong>82%</strong></div>
      <div className="readiness-row"><span>Practical validation</span><strong>68%</strong></div>
      <div className="readiness-row"><span>Industry alignment</span><strong>72%</strong></div>
    </div>
  );
}

function SkillGapList() {
  return (
    <div className="chart-card">
      <div className="card-heading"><div><h3>Priority skill gaps</h3><p>Improve these next</p></div></div>
      {["Cloud deployment", "Docker", "System design", "CI/CD"].map((x, i) => (
        <div className="list-row" key={x}><span>{x}</span><span className={`badge ${i < 2 ? "danger" : "warning"}`}>{i < 2 ? "High" : "Medium"}</span></div>
      ))}
    </div>
  );
}

function Recommended() {
  return (
    <div className="chart-card">
      <div className="card-heading"><div><h3>Recommended courses</h3><p>High relevance to your pathway</p></div></div>
      {["Cloud Fundamentals", "Docker & DevOps", "System Design"].map(x => (
        <div className="course-row" key={x}><div className="course-icon"><GraduationCap size={18}/></div><div><strong>{x}</strong><small>86% relevance</small></div></div>
      ))}
    </div>
  );
}

function RecruiterPanels() {
  return (
    <div className="dashboard-grid">
      <div className="wide"><DemandChart /></div>
      <div><SkillChart /></div>
      <div className="wide"><CandidateTable /></div>
      <div><GapChart /></div>
    </div>
  );
}

function CandidateTable() {
  const rows = [["Backend Developer", "High", "1,284"], ["Cloud Engineer", "Very High", "462"], ["Data Analyst", "High", "718"], ["Cybersecurity Analyst", "Rising", "284"]];
  return <div className="chart-card"><div className="card-heading"><div><h3>Hiring demand</h3><p>Roles with active market signals</p></div></div><div className="table-scroll"><table><thead><tr><th>Role</th><th>Demand</th><th>Available</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i}>{i===1?<span className="badge success">{c}</span>:c}</td>)}</tr>)}</tbody></table></div></div>;
}

function TrainerPanels() {
  return (
    <div className="dashboard-grid">
      <div className="wide"><SkillChart /></div>
      <div><AlertPanel /></div>
      <div className="wide"><ModuleProgress /></div>
      <div><GapChart /></div>
    </div>
  );
}

function AlertPanel() {
  return <div className="chart-card"><div className="card-heading"><div><h3>Upskill alerts</h3><p>Industry changes needing attention</p></div></div><div className="alert-box"><AlertTriangle/><div><strong>Generative AI</strong><p>Demand growth detected across multiple job roles.</p></div></div><div className="alert-box"><AlertTriangle/><div><strong>Cloud Security</strong><p>Recommended module refresh.</p></div></div></div>;
}

function ModuleProgress() {
  return <div className="chart-card"><div className="card-heading"><div><h3>Assigned module progress</h3><p>Current learner completion</p></div></div>{[["Cloud Computing",85],["Cybersecurity",62],["Data Engineering",48],["AI Foundations",31]].map(([x,v])=><div className="module-progress" key={x}><div><span>{x}</span><strong>{v}%</strong></div><div className="progress-track"><div className="progress-fill teal" style={{width:`${v}%`}}/></div></div>)}</div>;
}

function InstitutePanels() {
  return (
    <div className="dashboard-grid">
      <div className="wide"><DemandChart /></div>
      <div><Capacity /></div>
      <div className="wide"><CourseHealth /></div>
      <div><GapChart /></div>
    </div>
  );
}

function Capacity() {
  return <div className="chart-card"><div className="card-heading"><div><h3>Training capacity</h3><p>Institute readiness</p></div></div>{[["Trainers",78],["Equipment",64],["Infrastructure",71]].map(([x,v])=><div className="module-progress" key={x}><div><span>{x}</span><strong>{v}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${v}%`}}/></div></div>)}</div>;
}

function CourseHealth() {
  const rows = [["Web Development","High","Update"],["Data Entry","Low","Review"],["Cloud Computing","High","Expand"],["Legacy Java","Low","Review"]];
  return <div className="chart-card"><div className="card-heading"><div><h3>Course health</h3><p>Demand-alignment signals</p></div></div><table><thead><tr><th>Course</th><th>Demand</th><th>Action</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td><span className={`badge ${r[1]==="High"?"success":"warning"}`}>{r[2]}</span></td></tr>)}</tbody></table></div>;
}

function PolicyPanels() {
  return (
    <div className="dashboard-grid">
      <div className="wide"><DemandChart /></div>
      <div><SkillChart /></div>
      <div className="wide"><DistrictTable /></div>
      <div><GapChart /></div>
    </div>
  );
}

function DistrictTable() {
  const rows = [["Bhopal","High","Medium","Review capacity"],["Indore","Very High","High","Expand training"],["Jabalpur","Medium","Low","Trainer development"],["Gwalior","High","Medium","Course update"]];
  return <div className="chart-card"><div className="card-heading"><div><h3>District intelligence</h3><p>Priority action by location</p></div></div><table><thead><tr><th>District</th><th>Skill gap</th><th>Capacity</th><th>Recommended action</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}><td><strong>{r[0]}</strong></td><td><span className="badge danger">{r[1]}</span></td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table></div>;
}