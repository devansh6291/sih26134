import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  MapPin,
  Clock3,
  Plus,
  Users,
  X,
} from "lucide-react";
import "./recruiter.css";
import { useAuth } from "../../context/AuthContext";
import {
  createJob,
  getRecruiterJobs,
} from "../../services/api";

export default function RecruiterJobs() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const recruiterId = currentUser?.userId || "recruiter-demo";
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full Time",
    experience: "",
    salary: "",
    skills: "",
    description: "",
  });

  const loadJobs = () => {
    setJobs(getRecruiterJobs(recruiterId));
  };

  useEffect(() => {
    loadJobs();

    window.addEventListener("storage", loadJobs);
    return () => window.removeEventListener("storage", loadJobs);
  }, [recruiterId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateJob = (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.company ||
      !formData.location ||
      !formData.experience ||
      !formData.salary ||
      !formData.skills
    ) {
      alert("Please fill all required fields.");
      return;
    }

    createJob({
      title: formData.title,
      company: formData.company,
      location: formData.location,
      type: formData.type,
      experience: formData.experience,
      salary: formData.salary,
      skills: formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      description:
        formData.description ||
        "No job description provided.",
      recruiterId,
    });
    loadJobs();

    setShowForm(false);

    setFormData({
      title: "",
      company: "",
      location: "",
      type: "Full Time",
      experience: "",
      salary: "",
      skills: "",
      description: "",
    });
  };

  return (
    <div className="recruiter-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">RECRUITER</span>

          <h1>Job Postings</h1>

          <p>
            Create and manage your job opportunities.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />
          Post New Job
        </button>
      </div>

      <div className="recruiter-stats">
        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon">
            <BriefcaseBusiness size={21} />
          </div>

          <div>
            <span>Active Jobs</span>
            <strong>
              {jobs.filter((job) => job.status === "Active").length}
            </strong>
          </div>
        </div>

        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon">
            <Users size={21} />
          </div>

          <div>
            <span>Applicants</span>
            <strong>
              {jobs.reduce(
                (total, job) => total + (job.applicants || 0),
                0
              )}
            </strong>
          </div>
        </div>

        <div className="recruiter-stat-card">
          <div className="recruiter-stat-icon">
            <BriefcaseBusiness size={21} />
          </div>

          <div>
            <span>Total Postings</span>
            <strong>{jobs.length}</strong>
          </div>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Your Job Postings</h2>
          <p>Your published openings.</p>
        </div>
      </div>

      <div className="recruiter-job-grid">
        {jobs.map((job) => (
        <article className="recruiter-job-card" key={job.id}>
          <div className="recruiter-job-top">
            <div className="company-logo">
              {job.company.charAt(0)}
            </div>

            <span className="job-status active">
              {job.status}
            </span>
          </div>

          <div className="job-company">
            {job.company}
          </div>

          <h3>{job.title}</h3>

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

          <div className="recruiter-job-salary">
            {job.salary}
          </div>

          <div className="job-skills">
            {job.skills.map((skill) => (
              <span
                className="job-skill"
                key={skill}
              >
                {skill}
              </span>
            ))}
          </div>

          <p className="recruiter-job-description">
            {job.description}
          </p>

          <div className="recruiter-job-footer">
            <div className="applicant-count">
              <Users size={16} />

              <strong>{job.applicants}</strong>

              <span>Applicant</span>
            </div>

            <button
              className="secondary-button"
              onClick={() => navigate("/recruiter/candidates")}
            >
              View Applicants
            </button>
          </div>
        </article>
        ))}
        {jobs.length === 0 && (
          <div className="empty-state">
            <h3>No job postings yet</h3>
            <p>Post a job and it will be visible to candidates.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="recruiter-modal">
            <div className="modal-header">
              <div>
                <span className="page-eyebrow">
                  NEW OPENING
                </span>

                <h2>Create Job Posting</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Job Title *</label>

                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>

                <div className="form-group">
                  <label>Company *</label>

                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>

                <div className="form-group">
                  <label>Location *</label>

                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore"
                  />
                </div>

                <div className="form-group">
                  <label>Job Type</label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Experience *</label>

                  <input
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 0–2 Years"
                  />
                </div>

                <div className="form-group">
                  <label>Salary *</label>

                  <input
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. ₹6–10 LPA"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Required Skills *</label>

                <input
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, Node.js, PostgreSQL"
                />

                <small>
                  Separate skills with commas.
                </small>
              </div>

              <div className="form-group">
                <label>Job Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe the job..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}