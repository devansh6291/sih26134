import React from "react";
import JobCard from "./JobCard";

export default function JobList({
  jobs,
  onViewDetails,
  onApply,
}) {
  if (jobs.length === 0) {
    return (
      <div className="jobs-empty">
        <div className="jobs-empty-icon">⌕</div>

        <h3>No jobs found</h3>

        <p>
          Try changing your search or filters to find more opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="jobs-grid">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onViewDetails={onViewDetails}
          onApply={onApply}
        />
      ))}
    </div>
  );
}