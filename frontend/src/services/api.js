
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kaushalToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =========================================================
   LOCAL DEMO DATA
   Later these functions can be replaced with FastAPI calls.
========================================================= */

const JOBS_KEY = "kaushalJobs";
const APPLICATIONS_KEY = "kaushalApplications";

const defaultJobs = [
  {
    id: 1,
    title: "Full Stack Developer",
    company: "TechNova Solutions",
    location: "Bangalore",
    type: "Full Time",
    experience: "0–2 Years",
    salary: "₹6–10 LPA",
    skills: ["React", "Node.js", "PostgreSQL"],
    description:
      "Build and maintain scalable web applications using modern frontend and backend technologies.",
    posted: "Today",
    applicants: 0,
    status: "Active",
    recruiterId: "demo-recruiter",
  },
];

function readLocalData(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return fallback;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
}

function writeLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* =========================================================
   JOBS
========================================================= */

export function getJobs() {
  const jobs = readLocalData(JOBS_KEY, null);

  if (!jobs) {
    writeLocalData(JOBS_KEY, defaultJobs);
    return defaultJobs;
  }

  return jobs;
}

export function createJob(job) {
  const jobs = getJobs();

  const newJob = {
    id: Date.now(),
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    experience: job.experience,
    salary: job.salary,
    skills: job.skills || [],
    description: job.description || "No description provided.",
    posted: "Just now",
    applicants: 0,
    status: "Active",
    recruiterId: job.recruiterId,
  };

  const updatedJobs = [...jobs, newJob];

  writeLocalData(JOBS_KEY, updatedJobs);

  return newJob;
}

export function getRecruiterJobs(recruiterId) {
  return getJobs().filter(
    (job) =>
      job.recruiterId === recruiterId ||
      (recruiterId === "recruiter-demo" &&
        job.recruiterId === "demo-recruiter")
  );
}

/* =========================================================
   APPLICATIONS
========================================================= */

export function getApplications() {
  return readLocalData(APPLICATIONS_KEY, []);
}

export function applyForJob(application) {
  const applications = getApplications();

  const alreadyApplied = applications.some(
    (item) =>
      Number(item.jobId) === Number(application.jobId) &&
      item.candidateId === application.candidateId
  );

  if (alreadyApplied) {
    return {
      success: false,
      message: "You have already applied for this job.",
    };
  }

  const newApplication = {
    id: Date.now(),

    jobId: application.jobId,
    recruiterId: application.recruiterId,

    candidateId: application.candidateId,
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,

    candidateRole: application.candidateRole,

    skills: application.skills || [],

    location: application.location || "",
    phone: application.phone || "",
    experience: application.experience || "",
    education: application.education || "",
    resume: application.resume || "",
    summary: application.summary || "",

    readiness: application.readiness || 0,

    status: "Under Review",

    appliedAt: new Date().toISOString(),
  };

  const updatedApplications = [
    ...applications,
    newApplication,
  ];

  writeLocalData(
    APPLICATIONS_KEY,
    updatedApplications
  );

  /* Update applicant count on the job */

  const jobs = getJobs();

  const updatedJobs = jobs.map((job) => {
    if (Number(job.id) !== Number(application.jobId)) {
      return job;
    }

    return {
      ...job,
      applicants: (job.applicants || 0) + 1,
    };
  });

  writeLocalData(JOBS_KEY, updatedJobs);

  return {
    success: true,
    application: newApplication,
  };
}

/* =========================================================
   RECRUITER APPLICATIONS
========================================================= */

export function getRecruiterApplications(recruiterId) {
  const applications = getApplications();

  return applications.filter(
    (application) =>
      application.recruiterId === recruiterId ||
      (recruiterId === "recruiter-demo" &&
        application.recruiterId === "demo-recruiter")
  );
}

export function getCandidateApplications(candidateId) {
  return getApplications().filter(
    (application) => application.candidateId === candidateId
  );
}

/* =========================================================
   UPDATE APPLICATION STATUS
========================================================= */

export function updateApplicationStatus(
  applicationId,
  status
) {
  const applications = getApplications();

  const updatedApplications = applications.map(
    (application) =>
      Number(application.id) === Number(applicationId)
        ? {
            ...application,
            status,
          }
        : application
  );

  writeLocalData(
    APPLICATIONS_KEY,
    updatedApplications
  );

  return updatedApplications.find(
    (application) =>
      Number(application.id) === Number(applicationId)
  );
}

export default api;
