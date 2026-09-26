import axios from "axios";

const defaultApiHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? window.location.hostname
    : "localhost";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${defaultApiHost}:8000/api`,
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

function getErrorMessage(error) {
  const message =
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message;
  return typeof message === "string"
    ? message
    : message
      ? JSON.stringify(message)
      : "The request could not be completed.";
}

function withApiError(promise) {
  return promise.catch((error) => {
    throw new Error(getErrorMessage(error));
  });
}

function toUiStatus(status) {
  const labels = {
    active: "Active",
    closed: "Closed",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
  };
  return labels[status] || status;
}

function toApiStatus(status) {
  const values = {
    "Under Review": "under_review",
    Shortlisted: "shortlisted",
    Rejected: "rejected",
  };
  return values[status] || status;
}

function mapJob(job) {
  return {
    id: job.jobId,
    recruiterId: job.recruiterId,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.jobType,
    experience: job.experience,
    salary: job.salary,
    skills: job.skills || [],
    description: job.description || "",
    status: toUiStatus(job.status),
    posted: job.publishedAt
      ? new Date(job.publishedAt).toLocaleDateString()
      : "",
    applicants: job.applicantCount || 0,
  };
}

function mapApplication(application) {
  const candidate = application.candidate || {};
  const job = application.job || {};

  return {
    id: application.applicationId,
    jobId: application.jobId ?? job.jobId,
    recruiterId: application.recruiterId,
    candidateId: candidate.userId,
    candidateName: candidate.fullName,
    candidateEmail: candidate.email,
    candidateRole: application.jobTitle || job.title || "",
    company: application.company || job.company || "",
    skills: candidate.skills || [],
    location: candidate.location || "",
    phone: candidate.phone || "",
    experience: candidate.experience || "",
    education: candidate.education || "",
    resume: candidate.resume || "",
    summary: candidate.summary || "",
    readiness: candidate.readiness || 0,
    status: toUiStatus(application.status),
    appliedAt: application.appliedAt,
  };
}

export async function loginWithPassword(email, password) {
  return withApiError(api.post("/auth/login", { email, password })).then(
    ({ data }) => data
  );
}

export async function registerAccount(account) {
  return withApiError(
    api.post("/auth/register", {
      email: account.email,
      password: account.password,
      fullName: account.fullName,
      roleType: account.roleType,
      orgName: account.orgName || null,
      locationPref: account.locationPref || null,
      skills: account.skills || [],
    })
  ).then(({ data }) => data);
}

export async function getCurrentUser() {
  return withApiError(api.get("/auth/me")).then(({ data }) => data);
}

export function getJobs(filters = {}) {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.location && filters.location !== "All") {
    params.location = filters.location;
  }
  if (filters.type && filters.type !== "All") params.type = filters.type;

  return withApiError(api.get("/jobs", { params })).then(({ data }) =>
    data.map(mapJob)
  );
}

export function getRecruiterJobs() {
  return withApiError(api.get("/recruiter/jobs")).then(({ data }) =>
    data.map(mapJob)
  );
}

export function createJob(job) {
  return withApiError(
    api.post("/recruiter/jobs", {
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.type,
      experience: job.experience,
      salary: job.salary,
      skills: job.skills || [],
      description: job.description || "",
    })
  ).then(({ data }) => mapJob(data));
}

export function applyForJob(jobId, coverNote = "") {
  return withApiError(
    api.post(`/jobs/${jobId}/apply`, { coverNote })
  ).then(({ data }) => mapApplication(data));
}

export function getCandidateApplications() {
  return withApiError(api.get("/me/applications")).then(({ data }) =>
    data.map(mapApplication)
  );
}

export function getRecruiterApplications() {
  return withApiError(api.get("/recruiter/applications")).then(({ data }) =>
    data.map(mapApplication)
  );
}

export function updateApplicationStatus(applicationId, status) {
  return withApiError(
    api.patch(`/recruiter/applications/${applicationId}/status`, {
      status: toApiStatus(status),
    })
  ).then(({ data }) => mapApplication(data));
}

export function getNotifications(unreadOnly = false) {
  return withApiError(
    api.get("/me/notifications", {
      params: { unreadOnly },
    })
  ).then(({ data }) => data);
}

export function markNotificationRead(notificationId) {
  return withApiError(
    api.patch(`/me/notifications/${notificationId}/read`)
  ).then(({ data }) => data);
}

export function getIntelligenceOverview() {
  return withApiError(api.get("/intelligence/overview")).then(
    ({ data }) => data
  );
}

export function getDemandBreakdown(filters = {}) {
  return withApiError(
    api.get("/intelligence/demand", {
      params: {
        location: filters.location,
        sector: filters.sector,
        roleTitle: filters.roleTitle,
      },
    })
  ).then(({ data }) => data);
}

export function getMarketSignals(filters = {}) {
  return withApiError(
    api.get("/intelligence/signals", {
      params: {
        sourceType: filters.sourceType,
        location: filters.location,
        roleTitle: filters.roleTitle,
        skill: filters.skill,
        limit: filters.limit || 100,
      },
    })
  ).then(({ data }) => data);
}

export function createMarketSignal(signal) {
  return withApiError(
    api.post("/intelligence/signals", {
      sourceType: signal.sourceType,
      sourceReference: signal.sourceReference || null,
      roleTitle: signal.roleTitle,
      sector: signal.sector || null,
      location: signal.location,
      skillName: signal.skillName,
      proficiencyLevel: signal.proficiencyLevel || "unspecified",
      demandValue: Number(signal.demandValue || 1),
      evidenceSummary: signal.evidenceSummary || null,
    })
  ).then(({ data }) => data);
}

export function validateMarketSignal(signalId, validation) {
  return withApiError(
    api.post(`/intelligence/signals/${signalId}/validation`, {
      validationStatus: validation.status,
      comments: validation.comments || null,
    })
  ).then(({ data }) => data);
}

export function getCourses(filters = {}) {
  return withApiError(
    api.get("/intelligence/courses", {
      params: {
        sector: filters.sector,
        courseStatus: filters.courseStatus,
      },
    })
  ).then(({ data }) => data);
}

export function createCourse(course) {
  return withApiError(
    api.post("/intelligence/courses", {
      courseCode: course.courseCode,
      courseName: course.courseName,
      qualification: course.qualification || null,
      sector: course.sector,
      targetRole: course.targetRole,
      skills: course.skills || [],
      proficiencyLevels: course.proficiencyLevels || {},
      equipmentRequired: course.equipmentRequired || [],
      trainerCapabilities: course.trainerCapabilities || [],
      curriculumVersion: course.curriculumVersion || null,
      placementRate: course.placementRate ?? null,
      enrollmentCount: Number(course.enrollmentCount || 0),
      courseStatus: course.courseStatus || "active",
    })
  ).then(({ data }) => data);
}

export function updateCourse(courseId, course) {
  return withApiError(
    api.patch(`/intelligence/courses/${courseId}`, {
      courseCode: course.courseCode,
      courseName: course.courseName,
      qualification: course.qualification || null,
      sector: course.sector,
      targetRole: course.targetRole,
      skills: course.skills || [],
      proficiencyLevels: course.proficiencyLevels || {},
      equipmentRequired: course.equipmentRequired || [],
      trainerCapabilities: course.trainerCapabilities || [],
      curriculumVersion: course.curriculumVersion || null,
      placementRate: course.placementRate ?? null,
      enrollmentCount: Number(course.enrollmentCount || 0),
      courseStatus: course.courseStatus || "active",
    })
  ).then(({ data }) => data);
}

export function analyzeCourse(courseId) {
  return withApiError(
    api.get(`/intelligence/courses/${courseId}/analysis`)
  ).then(({ data }) => data);
}

export function getTrainingCapacity(districtId) {
  return withApiError(
    api.get("/intelligence/capacity", {
      params: districtId ? { districtId } : {},
    })
  ).then(({ data }) => data);
}

export function createTrainingCapacity(capacity) {
  return withApiError(
    api.post("/intelligence/capacity", {
      districtId: capacity.districtId,
      courseId: capacity.courseId ? Number(capacity.courseId) : null,
      seats: Number(capacity.seats || 0),
      trainerCount: Number(capacity.trainerCount || 0),
      trainerCapabilities: capacity.trainerCapabilities || [],
      equipmentAvailable: capacity.equipmentAvailable || [],
      equipmentReadiness: Number(capacity.equipmentReadiness || 0),
      infrastructureReadiness: Number(capacity.infrastructureReadiness || 0),
    })
  ).then(({ data }) => data);
}

export function updateTrainingCapacity(capacityId, capacity) {
  return withApiError(
    api.patch(`/intelligence/capacity/${capacityId}`, {
      districtId: capacity.districtId,
      courseId: capacity.courseId ? Number(capacity.courseId) : null,
      seats: Number(capacity.seats || 0),
      trainerCount: Number(capacity.trainerCount || 0),
      trainerCapabilities: capacity.trainerCapabilities || [],
      equipmentAvailable: capacity.equipmentAvailable || [],
      equipmentReadiness: Number(capacity.equipmentReadiness || 0),
      infrastructureReadiness: Number(capacity.infrastructureReadiness || 0),
    })
  ).then(({ data }) => data);
}

export function getDistrictPlan(districtId) {
  return withApiError(
    api.get(`/intelligence/district-plans/${encodeURIComponent(districtId)}`)
  ).then(({ data }) => data);
}

export function getCandidateGuidance() {
  return withApiError(api.get("/intelligence/candidate-guidance")).then(
    ({ data }) => data
  );
}

export function createPlacementOutcome(outcome) {
  return withApiError(
    api.post("/intelligence/placements", {
      courseId: outcome.courseId ? Number(outcome.courseId) : null,
      roleTitle: outcome.roleTitle,
      sector: outcome.sector || null,
      districtId: outcome.districtId,
      placed: outcome.placed !== false,
      candidateRating: outcome.candidateRating
        ? Number(outcome.candidateRating)
        : null,
      employerRating: outcome.employerRating
        ? Number(outcome.employerRating)
        : null,
      courseRelevanceScore: outcome.courseRelevanceScore
        ? Number(outcome.courseRelevanceScore)
        : null,
      feedbackNotes: outcome.feedbackNotes || null,
    })
  ).then(({ data }) => data);
}

export default api;
