
import React, { useEffect, useMemo, useState } from "react";
import JobFilters from "../../components/jobs/JobFilters";
import JobList from "../../components/jobs/JobList";
import {
  applyForJob,
  getCandidateApplications,
  getJobs,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./candidate.css";

export default function CandidateJobs() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("latest");

  const candidate = {
    id: currentUser?.userId || "candidate-demo",
    name: currentUser?.fullName || "Candidate",
    email: currentUser?.email || "",
    skills: currentUser?.skills || ["React", "JavaScript", "Node.js"],
    location: currentUser?.location || "Bangalore",
  };

  const loadJobs = () => {
    const availableJobs = getJobs();

    setJobs(
      availableJobs.filter(
        (job) => job.status === "Active"
      )
    );
    setApplications(getCandidateApplications(candidate.id));
  };

  useEffect(() => {
    loadJobs();
    window.addEventListener("storage", loadJobs);
    return () => window.removeEventListener("storage", loadJobs);
  }, [candidate.id]);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((job) => {
        return (
          job.title?.toLowerCase().includes(query) ||
          job.company?.toLowerCase().includes(query) ||
          job.skills?.some((skill) =>
            skill.toLowerCase().includes(query)
          )
        );
      });
    }

    if (location !== "All") {
      result = result.filter(
        (job) => job.location === location
      );
    }

    if (type !== "All") {
      result = result.filter(
        (job) => job.type === type
      );
    }

    if (sort === "latest") {
      result.sort((a, b) => {
        if (a.id > b.id) return -1;
        if (a.id < b.id) return 1;
        return 0;
      });
    }

    return result;
  }, [
    jobs,
    search,
    location,
    type,
    sort,
  ]);

  const handleViewDetails = (job) => {
    alert(
      `${job.title} at ${job.company}

Location: ${job.location}
Type: ${job.type}
Experience: ${job.experience}
Salary: ${job.salary}

Skills:
${(job.skills || []).join(", ")}

${job.description}`
    );
  };

  const handleApply = (job) => {
    const alreadyApplied = applications.some(
      (application) =>
        Number(application.jobId) === Number(job.id) &&
        application.candidateId === candidate.id
    );

    if (alreadyApplied) {
      alert(
        `You have already applied for ${job.title}.`
      );
      return;
    }

    const result = applyForJob({
      jobId: job.id,

      recruiterId: job.recruiterId,

      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,

      candidateRole: job.title,

      skills: candidate.skills,

      location: candidate.location,

      readiness: 78,
    });

    if (!result.success) {
      alert(result.message);
      return;
    }

    /*
      Reload jobs so applicant count changes immediately.
    */
    loadJobs();

    alert(
      `Application submitted successfully!

${job.title}
${job.company}`
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow dark">
            CAREER OPPORTUNITIES
          </div>

          <h1>Available Opportunities</h1>

          <p>
            Discover jobs matched with your skills and
            career goals.
          </p>
        </div>

        <div className="date-pill">
          {filteredJobs.length} opportunities
        </div>
      </div>

      <JobFilters
        search={search}
        setSearch={setSearch}
        location={location}
        setLocation={setLocation}
        type={type}
        setType={setType}
        sort={sort}
        setSort={setSort}
      />

      <JobList
        jobs={filteredJobs}
        onViewDetails={handleViewDetails}
        onApply={handleApply}
      />

      <section className="candidate-applications">
        <div className="candidate-applications-heading">
          <div>
            <h2>My Applications</h2>
            <p>Track recruiter updates on the jobs you applied for.</p>
          </div>
          <span>{applications.length} applications</span>
        </div>

        {applications.length > 0 ? (
          <div className="candidate-application-list">
            {applications.map((application) => {
              const job = jobs.find(
                (item) => Number(item.id) === Number(application.jobId)
              );
              const isSelected = application.status === "Shortlisted";

              return (
                <article
                  className="candidate-application-card"
                  key={application.id}
                >
                  <div>
                    <h3>{job?.title || application.candidateRole}</h3>
                    <p>{job?.company || "Company"}</p>
                  </div>
                  <span
                    className={`candidate-application-status ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    {isSelected
                      ? "Selected by recruiter"
                      : application.status}
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="candidate-applications-empty">
            You have not applied to any jobs yet.
          </p>
        )}
      </section>
    </div>
  );
}
