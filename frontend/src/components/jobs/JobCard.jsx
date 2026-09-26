import React, { useState } from "react";
import { MapPin, Clock3, Bookmark, BriefcaseBusiness } from "lucide-react";

export default function JobCard({ job, onViewDetails, onApply }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="company-logo">
          {job.company.charAt(0)}
        </div>

        <button
          className={`bookmark-button ${saved ? "saved" : ""}`}
          onClick={() => setSaved(!saved)}
          aria-label="Save job"
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="job-company">
        {job.company}
      </div>

      <h3 className="job-title">
        {job.title}
      </h3>

      <div className="job-meta">
        <span>
          <MapPin size={14} />
          {job.location}
        </span>

        <span>
          <BriefcaseBusiness size={14} />
          {job.type}
        </span>

        <span>
          <Clock3 size={14} />
          {job.posted}
        </span>
      </div>

      <div className="job-salary">
        {job.salary}
      </div>

      <div className="job-skills">
        {job.skills.map((skill) => (
          <span key={skill} className="job-skill">
            {skill}
          </span>
        ))}
      </div>

      <div className="job-card-actions">
        <button
          className="secondary-button"
          onClick={() => onViewDetails(job)}
        >
          View Details
        </button>

        <button
          className="primary-button"
          onClick={() => onApply(job)}
        >
          Apply Now
        </button>
      </div>
    </article>
  );
}