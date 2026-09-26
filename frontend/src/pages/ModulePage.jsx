import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Filter, Search, Plus } from "lucide-react";
import { ROLE_LABELS } from "../config/roles";

const content = {
  "Skill Gap": {
    description: "Identify the difference between current capability and industry demand.",
    cards: ["Critical skill gaps", "Emerging skills", "Recommended learning"]
  },
  "Courses": {
    description: "Explore courses aligned with current labour-market requirements.",
    cards: ["High-demand courses", "Courses under review", "Recommended updates"]
  },
  "Career Path": {
    description: "Map current skills to next roles and career pathways.",
    cards: ["Current role", "Next roles", "Path confidence"]
  },
  "Skill Tracks": {
    description: "Track progress through structured skill and certification pathways.",
    cards: ["Active tracks", "Credits earned", "Projects completed"]
  },
  "Certificates": {
    description: "View verified certificates and practical validation status.",
    cards: ["Certificates", "Pending evaluations", "Verified skills"]
  },
  "Job Postings": {
    description: "Manage job postings and capture employer demand signals.",
    cards: ["Active jobs", "Drafts", "Applications"]
  },
  "Candidates": {
    description: "Search for candidates by role, skill and readiness.",
    cards: ["Job-ready candidates", "Skill matches", "Shortlisted"]
  },
  "Employer Survey": {
    description: "Capture employer expectations and changing skill requirements.",
    cards: ["Responses", "Priority skills", "Validation rate"]
  },
  "Validation": {
    description: "Review and validate industry skill-gap signals.",
    cards: ["Pending validation", "Endorsed", "Rejected"]
  },
  "Placement Feedback": {
    description: "Capture placement outcomes and employer feedback.",
    cards: ["Feedback received", "Positive outcomes", "Action items"]
  },
  "Assigned Modules": {
    description: "Manage modules assigned to you and monitor learner progress.",
    cards: ["Assigned", "In progress", "Completed"]
  },
  "Upskill Alerts": {
    description: "Review emerging requirements that may require trainer development.",
    cards: ["Critical alerts", "Emerging skills", "Recommended actions"]
  },
  "Training Resources": {
    description: "Access current learning resources and industry-aligned material.",
    cards: ["Resources", "Recently added", "Recommended"]
  },
  "Evaluation Queue": {
    description: "Evaluate practical project submissions and learner evidence.",
    cards: ["Pending", "In review", "Completed"]
  },
  "Curriculum": {
    description: "Translate employer demand into evidence-based curriculum updates.",
    cards: ["Updates proposed", "Employer validated", "Obsolete topics"]
  },
  "Trainers": {
    description: "Plan trainer capacity and development based on emerging demand.",
    cards: ["Active trainers", "Upskill required", "Shortfalls"]
  },
  "Training Capacity": {
    description: "Monitor seats, trainers and infrastructure against local demand.",
    cards: ["Capacity utilization", "Open seats", "Capacity gaps"]
  },
  "Equipment": {
    description: "Plan equipment based on course demand and emerging technologies.",
    cards: ["Ready", "Procurement needed", "Critical gaps"]
  },
  "District Plan": {
    description: "Generate district-level training plans from labour-market signals.",
    cards: ["Priority districts", "Capacity gaps", "Action items"]
  },
  "Labour Market": {
    description: "Explore job-posting, employer and industry demand signals.",
    cards: ["Job signals", "Top roles", "Growth sectors"]
  },
  "Demand Forecast": {
    description: "Review projected demand curves and emerging-skill velocity.",
    cards: ["Forecast horizon", "Emerging skills", "Growth rate"]
  },
  "Skill Gaps": {
    description: "Monitor skill gaps across roles, locations and proficiency levels.",
    cards: ["Critical gaps", "Undersupplied skills", "Trainer shortfalls"]
  },
  "Course Analysis": {
    description: "Identify obsolete, oversupplied and high-demand courses.",
    cards: ["Courses to update", "Oversupplied", "Expand"]
  },
  "District Reports": {
    description: "Review capacity gaps and trainer development needs by district.",
    cards: ["Districts", "Capacity gaps", "Trainer needs"]
  },
  "Policy Reports": {
    description: "Generate intelligence reports for evidence-based planning.",
    cards: ["Weekly digest", "Monthly report", "District rollup"]
  }
};

export default function ModulePage({ title, role }) {
  const d = content[title] || {
    description: "Interactive workspace.",
    cards: ["Open items", "In review", "Completed"]
  };

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
        <div>
          <span className="eyebrow dark">{ROLE_LABELS[role]} • WORKSPACE</span>
          <h1>{title}</h1>
          <p>{d.description}</p>
        </div>
        <button className="primary-button"><Plus size={17}/> New action</button>
      </motion.div>

      <div className="module-stat-grid">
        {d.cards.map((x, i) => (
          <div className="module-stat" key={x}>
            <span>{x}</span>
            <strong>{[48, 23, 76][i % 3]}</strong>
            <small>{i === 0 ? "Current items" : "This month"}</small>
          </div>
        ))}
      </div>

      <div className="toolbar-card">
        <div className="toolbar-search"><Search size={17}/><input placeholder={`Search ${title.toLowerCase()}...`} /></div>
        <button className="secondary-button"><Filter size={16}/> Filters</button>
      </div>

      <div className="chart-card">
        <div className="card-heading">
          <div><h3>{title} overview</h3><p>Interactive demo data — connect FastAPI services to replace it with live data.</p></div>
          <span className="mini-badge">Demo data</span>
        </div>

        {[1,2,3,4,5].map((n) => (
          <div className="data-row" key={n}>
            <div className="data-main">
              <div className="row-icon"><CheckCircle2 size={18}/></div>
              <div><strong>{title} item {n}</strong><small>Updated recently • evidence available</small></div>
            </div>
            <span className={`badge ${n % 2 ? "success" : "warning"}`}>{n % 2 ? "Active" : "Review"}</span>
            <button className="row-action">View <ArrowUpRight size={15}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}