import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  MapPinned,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { ROLE_LABELS } from "../config/roles";
import { useAuth } from "../context/AuthContext";
import {
  analyzeCourse,
  createCourse,
  createMarketSignal,
  createPlacementOutcome,
  createTrainingCapacity,
  getCourses,
  getDemandBreakdown,
  getDistrictPlan,
  getIntelligenceOverview,
  getMarketSignals,
  getTrainingCapacity,
  updateCourse,
  updateTrainingCapacity,
  validateMarketSignal,
} from "../services/api";

const signalSources = {
  "Employer Survey": "employer_survey",
  "Placement Feedback": "placement_outcome",
  "Validation": "industry_consultation",
  "Labour Market": "job_posting",
  "Upskill Alerts": "emerging_technology",
};

export default function ModulePage({ title, role }) {
  const { currentUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [demand, setDemand] = useState(null);
  const [signals, setSignals] = useState([]);
  const [courses, setCourses] = useState([]);
  const [capacity, setCapacity] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingCapacityId, setEditingCapacityId] = useState(null);
  const [districtPlan, setDistrictPlan] = useState(null);
  const [district, setDistrict] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [signalForm, setSignalForm] = useState({
    sourceType: signalSources[title] || "industry_consultation",
    roleTitle: "",
    sector: "",
    location: "",
    skillName: "",
    proficiencyLevel: "intermediate",
    demandValue: "1",
    evidenceSummary: "",
  });
  const [courseForm, setCourseForm] = useState({
    courseCode: "",
    courseName: "",
    qualification: "",
    sector: "",
    targetRole: "",
    skills: "",
    equipmentRequired: "",
    trainerCapabilities: "",
    proficiencyLevels: "",
    curriculumVersion: "",
    placementRate: "",
    enrollmentCount: "0",
    courseStatus: "active",
  });
  const [capacityForm, setCapacityForm] = useState({
    districtId: "",
    courseId: "",
    seats: "0",
    trainerCount: "0",
    trainerCapabilities: "",
    equipmentAvailable: "",
    equipmentReadiness: "0",
    infrastructureReadiness: "0",
  });
  const [placementForm, setPlacementForm] = useState({
    roleTitle: "",
    sector: "",
    districtId: "",
    courseId: "",
    employerRating: "",
    courseRelevanceScore: "",
  });

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [nextOverview, nextSignals, nextDemand, nextCourses, nextCapacity] =
        await Promise.all([
          getIntelligenceOverview(),
          getMarketSignals({ limit: 100 }),
          getDemandBreakdown(),
          getCourses(),
          getTrainingCapacity(),
        ]);
      setOverview(nextOverview);
      setSignals(nextSignals);
      setDemand(nextDemand);
      setCourses(nextCourses);
      setCapacity(nextCapacity);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const withBusy = async (action, successMessage) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(
        typeof successMessage === "function"
          ? successMessage(result)
          : successMessage
      );
      await loadData();
      return true;
    } catch (actionError) {
      setError(actionError.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitSignal = async (event) => {
    event.preventDefault();
    const saved = await withBusy(
      () => createMarketSignal(signalForm),
      "Evidence signal saved."
    );
    if (saved) {
      setSignalForm((current) => ({
        ...current,
        roleTitle: "",
        sector: "",
        location: "",
        skillName: "",
        demandValue: "1",
        evidenceSummary: "",
      }));
    }
  };

  const submitCourse = (event) => {
    event.preventDefault();
    const payload = {
        ...courseForm,
        skills: courseForm.skills.split(",").map((item) => item.trim()).filter(Boolean),
        equipmentRequired: courseForm.equipmentRequired.split(",").map((item) => item.trim()).filter(Boolean),
        trainerCapabilities: courseForm.trainerCapabilities.split(",").map((item) => item.trim()).filter(Boolean),
        proficiencyLevels: Object.fromEntries(
          courseForm.proficiencyLevels
            .split(",")
            .map((entry) => entry.split(":").map((item) => item.trim()))
            .filter(([skill, level]) => skill && level)
        ),
        placementRate: courseForm.placementRate || null,
        enrollmentCount: courseForm.enrollmentCount,
        courseStatus: courseForm.courseStatus,
      };
    withBusy(
      () => (editingCourseId
        ? updateCourse(editingCourseId, payload)
        : createCourse(payload)),
      editingCourseId
        ? "Course and curriculum record updated."
        : "Course and curriculum record saved."
    ).then((saved) => {
      if (saved) {
        setEditingCourseId(null);
        setCourseForm({
          courseCode: "",
          courseName: "",
          qualification: "",
          sector: "",
          targetRole: "",
          skills: "",
          equipmentRequired: "",
          trainerCapabilities: "",
          proficiencyLevels: "",
          curriculumVersion: "",
          placementRate: "",
          enrollmentCount: "0",
          courseStatus: "active",
        });
      }
    });
  };

  const editCourse = (course) => {
    setEditingCourseId(course.courseId);
    setCourseForm({
      courseCode: course.courseCode,
      courseName: course.courseName,
      qualification: course.qualification || "",
      sector: course.sector,
      targetRole: course.targetRole,
      skills: (course.skills || []).join(", "),
      equipmentRequired: (course.equipmentRequired || []).join(", "),
      trainerCapabilities: (course.trainerCapabilities || []).join(", "),
      proficiencyLevels: Object.entries(course.proficiencyLevels || {})
        .map(([skill, level]) => `${skill}:${level}`)
        .join(", "),
      curriculumVersion: course.curriculumVersion || "",
      placementRate: course.placementRate ?? "",
      enrollmentCount: String(course.enrollmentCount || 0),
      courseStatus: course.courseStatus,
    });
  };

  const cancelCourseEdit = () => {
    setEditingCourseId(null);
    setCourseForm({
      courseCode: "",
      courseName: "",
      qualification: "",
      sector: "",
      targetRole: "",
      skills: "",
      equipmentRequired: "",
      trainerCapabilities: "",
      proficiencyLevels: "",
      curriculumVersion: "",
      placementRate: "",
      enrollmentCount: "0",
      courseStatus: "active",
    });
  };

  const submitCapacity = (event) => {
    event.preventDefault();
    withBusy(
      () => {
        const payload = {
          ...capacityForm,
          trainerCapabilities: capacityForm.trainerCapabilities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          equipmentAvailable: capacityForm.equipmentAvailable
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        };
        return editingCapacityId
          ? updateTrainingCapacity(editingCapacityId, payload)
          : createTrainingCapacity(payload);
      },
      editingCapacityId
        ? "District training capacity updated."
        : "District training capacity saved."
    ).then((saved) => {
      if (saved) {
        setEditingCapacityId(null);
        setCapacityForm({
          districtId: "",
          courseId: "",
          seats: "0",
          trainerCount: "0",
          trainerCapabilities: "",
          equipmentAvailable: "",
          equipmentReadiness: "0",
          infrastructureReadiness: "0",
        });
      }
    });
  };

  const editCapacity = (item) => {
    setEditingCapacityId(item.capacityId);
    setCapacityForm({
      districtId: item.districtId,
      courseId: item.courseId ? String(item.courseId) : "",
      seats: String(item.seats),
      trainerCount: String(item.trainerCount),
      trainerCapabilities: (item.trainerCapabilities || []).join(", "),
      equipmentAvailable: (item.equipmentAvailable || []).join(", "),
      equipmentReadiness: String(item.equipmentReadiness),
      infrastructureReadiness: String(item.infrastructureReadiness),
    });
  };

  const cancelCapacityEdit = () => {
    setEditingCapacityId(null);
    setCapacityForm({
      districtId: "",
      courseId: "",
      seats: "0",
      trainerCount: "0",
      trainerCapabilities: "",
      equipmentAvailable: "",
      equipmentReadiness: "0",
      infrastructureReadiness: "0",
    });
  };

  const submitPlacement = (event) => {
    event.preventDefault();
    withBusy(
      () => createPlacementOutcome({
        ...placementForm,
        employerRating: placementForm.employerRating || null,
        courseRelevanceScore: placementForm.courseRelevanceScore || null,
      }),
      "Placement outcome recorded."
    );
  };

  const runDistrictPlan = async (event) => {
    event.preventDefault();
    setError("");
    setDistrictPlan(null);
    try {
      setDistrictPlan(await getDistrictPlan(district));
    } catch (planError) {
      setError(planError.message);
    }
  };

  const runCourseAnalysis = async (courseId) => {
    await withBusy(async () => {
      const analysis = await analyzeCourse(courseId);
      return analysis;
    }, (analysis) => analysis.recommendation);
  };

  const validateSignal = (signalId, validationStatus) => {
    withBusy(
      () => validateMarketSignal(signalId, { status: validationStatus }),
      "Employer validation recorded."
    );
  };

  const visibleSignals = signals.filter((signal) => {
    const searchText = query.toLowerCase().trim();
    if (!searchText) return true;
    return [
      signal.roleTitle,
      signal.location,
      signal.sector,
      signal.skillName,
      signal.sourceType,
    ].some((value) => value?.toLowerCase().includes(searchText));
  });
  const showSignalForm = Boolean(signalSources[title]) ||
    title === "Sector Growth" ||
    title === "Industry Consultation";
  const canManageCourses = role === "instituteAdmin" || role === "policyOfficer";
  const isCoursePage = [
    "Courses",
    "Curriculum",
    "Course Analysis",
  ].includes(title);
  const isCapacityPage = [
    "Trainers",
    "Training Capacity",
    "Equipment",
    "District Plan",
    "District Reports",
  ].includes(title);
  const isSignalPage = [
    "Labour Market",
    "Demand Forecast",
    "Skill Gaps",
    "Validation",
    "Employer Survey",
    "Upskill Alerts",
  ].includes(title);

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <span className="eyebrow dark">{ROLE_LABELS[role]} • WORKSPACE</span>
          <h1>{title}</h1>
          <p>Use recorded labour-market evidence to guide decisions. Recommendations are indicative and should be validated with employers.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => loadData()}
          disabled={busy}
        >
          <RefreshCw size={16} /> Refresh evidence
        </button>
      </motion.div>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {notice && <div className="success-banner" role="status">{notice}</div>}

      {overview && (
        <div className="module-stat-grid">
          <div className="module-stat"><span>Recorded signals</span><strong>{overview.totalSignals}</strong><small>Across all submitted sources</small></div>
          <div className="module-stat"><span>Courses under review</span><strong>{overview.coursesByStatus?.under_review || 0}</strong><small>Curriculum review queue</small></div>
          <div className="module-stat"><span>Training seats</span><strong>{overview.trainingSeats}</strong><small>{overview.trainerCount} trainers recorded</small></div>
        </div>
      )}

      {showSignalForm && (
        <section className="chart-card module-form-card">
          <div className="card-heading">
            <div><h3>Submit evidence</h3><p>Record one role-skill-location observation with its source and proficiency level.</p></div>
            <Plus size={18} />
          </div>
          <form className="module-form-grid" onSubmit={submitSignal}>
            <label>Evidence source
              <select value={signalForm.sourceType} onChange={(event) => setSignalForm({ ...signalForm, sourceType: event.target.value })}>
                <option value="job_posting">Job posting</option>
                <option value="employer_survey">Employer survey</option>
                <option value="industry_consultation">Industry consultation</option>
                <option value="sector_growth">Sector growth</option>
                <option value="emerging_technology">Emerging technology</option>
              </select>
            </label>
            <label>Role
              <input value={signalForm.roleTitle} onChange={(event) => setSignalForm({ ...signalForm, roleTitle: event.target.value })} required maxLength={255} />
            </label>
            <label>Sector
              <input value={signalForm.sector} onChange={(event) => setSignalForm({ ...signalForm, sector: event.target.value })} maxLength={150} />
            </label>
            <label>District / location
              <input value={signalForm.location} onChange={(event) => setSignalForm({ ...signalForm, location: event.target.value })} required maxLength={255} />
            </label>
            <label>Skill
              <input value={signalForm.skillName} onChange={(event) => setSignalForm({ ...signalForm, skillName: event.target.value })} required maxLength={150} />
            </label>
            <label>Required proficiency
              <select value={signalForm.proficiencyLevel} onChange={(event) => setSignalForm({ ...signalForm, proficiencyLevel: event.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
                <option value="unspecified">Unspecified</option>
              </select>
            </label>
            <label>Signal weight
              <input type="number" min="0" step="0.1" value={signalForm.demandValue} onChange={(event) => setSignalForm({ ...signalForm, demandValue: event.target.value })} required />
            </label>
            <label>Evidence summary
              <input value={signalForm.evidenceSummary} onChange={(event) => setSignalForm({ ...signalForm, evidenceSummary: event.target.value })} maxLength={5000} />
            </label>
            <button className="primary-button" disabled={busy}>{busy ? "Saving..." : "Save evidence"}</button>
          </form>
        </section>
      )}

      {title === "Placement Feedback" && (
        <section className="chart-card module-form-card">
          <div className="card-heading"><div><h3>Record placement outcome</h3><p>Use verified placement and employer feedback to assess course relevance.</p></div></div>
          <form className="module-form-grid" onSubmit={submitPlacement}>
            <label>Placed role<input value={placementForm.roleTitle} onChange={(event) => setPlacementForm({ ...placementForm, roleTitle: event.target.value })} required /></label>
            <label>Sector<input value={placementForm.sector} onChange={(event) => setPlacementForm({ ...placementForm, sector: event.target.value })} /></label>
            <label>District<input value={placementForm.districtId} onChange={(event) => setPlacementForm({ ...placementForm, districtId: event.target.value })} required /></label>
            <label>Course (optional)<select value={placementForm.courseId} onChange={(event) => setPlacementForm({ ...placementForm, courseId: event.target.value })}><option value="">Not linked</option>{courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.courseName}</option>)}</select></label>
            <label>Employer rating (1–5)<input type="number" min="1" max="5" step="0.1" value={placementForm.employerRating} onChange={(event) => setPlacementForm({ ...placementForm, employerRating: event.target.value })} /></label>
            <label>Course relevance (0–100)<input type="number" min="0" max="100" value={placementForm.courseRelevanceScore} onChange={(event) => setPlacementForm({ ...placementForm, courseRelevanceScore: event.target.value })} /></label>
            <button className="primary-button" disabled={busy}>Record outcome</button>
          </form>
        </section>
      )}

      {isCoursePage && canManageCourses && (
        <section className="chart-card module-form-card">
          <div className="card-heading"><div><h3>{editingCourseId ? "Update course record" : "Add a course record"}</h3><p>Include qualification, skills, equipment, trainer capabilities and placement evidence.</p></div></div>
          <form className="module-form-grid" onSubmit={submitCourse}>
            <label>Course code<input value={courseForm.courseCode} onChange={(event) => setCourseForm({ ...courseForm, courseCode: event.target.value })} required maxLength={100} /></label>
            <label>Course name<input value={courseForm.courseName} onChange={(event) => setCourseForm({ ...courseForm, courseName: event.target.value })} required maxLength={255} /></label>
            <label>Qualification<input value={courseForm.qualification} onChange={(event) => setCourseForm({ ...courseForm, qualification: event.target.value })} /></label>
            <label>Sector<input value={courseForm.sector} onChange={(event) => setCourseForm({ ...courseForm, sector: event.target.value })} required /></label>
            <label>Target role<input value={courseForm.targetRole} onChange={(event) => setCourseForm({ ...courseForm, targetRole: event.target.value })} required /></label>
            <label>Curriculum skills (comma-separated)<input value={courseForm.skills} onChange={(event) => setCourseForm({ ...courseForm, skills: event.target.value })} /></label>
            <label>Skill proficiency levels<input value={courseForm.proficiencyLevels} onChange={(event) => setCourseForm({ ...courseForm, proficiencyLevels: event.target.value })} placeholder="React:advanced, SQL:intermediate" /></label>
            <label>Curriculum version<input value={courseForm.curriculumVersion} onChange={(event) => setCourseForm({ ...courseForm, curriculumVersion: event.target.value })} maxLength={100} /></label>
            <label>Equipment required<input value={courseForm.equipmentRequired} onChange={(event) => setCourseForm({ ...courseForm, equipmentRequired: event.target.value })} /></label>
            <label>Trainer capabilities<input value={courseForm.trainerCapabilities} onChange={(event) => setCourseForm({ ...courseForm, trainerCapabilities: event.target.value })} /></label>
            <label>Historical placement rate (%)<input type="number" min="0" max="100" step="0.1" value={courseForm.placementRate} onChange={(event) => setCourseForm({ ...courseForm, placementRate: event.target.value })} /></label>
            <label>Current enrolment count<input type="number" min="0" step="1" value={courseForm.enrollmentCount} onChange={(event) => setCourseForm({ ...courseForm, enrollmentCount: event.target.value })} /></label>
            <label>Course status
              <select value={courseForm.courseStatus} onChange={(event) => setCourseForm({ ...courseForm, courseStatus: event.target.value })}>
                <option value="active">Active</option>
                <option value="under_review">Under review</option>
                <option value="obsolete">Obsolete (validated assessment)</option>
                <option value="oversupplied">Oversupplied (validated assessment)</option>
              </select>
            </label>
            <button className="primary-button" disabled={busy}>{editingCourseId ? "Update course" : "Save course"}</button>
            {editingCourseId && <button type="button" className="secondary-button" onClick={cancelCourseEdit}>Cancel edit</button>}
          </form>
        </section>
      )}

      {isCapacityPage && canManageCourses && (
        <section className="chart-card module-form-card">
          <div className="card-heading"><div><h3>{editingCapacityId ? "Update district training capacity" : "Record district training capacity"}</h3><p>Capture seats, trainer count, trainer capabilities, equipment and infrastructure readiness.</p></div></div>
          <form className="module-form-grid" onSubmit={submitCapacity}>
            <label>District<input value={capacityForm.districtId} onChange={(event) => setCapacityForm({ ...capacityForm, districtId: event.target.value })} required /></label>
            <label>Course (optional)<select value={capacityForm.courseId} onChange={(event) => setCapacityForm({ ...capacityForm, courseId: event.target.value })}><option value="">District-wide</option>{courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.courseName}</option>)}</select></label>
            <label>Seats<input type="number" min="0" value={capacityForm.seats} onChange={(event) => setCapacityForm({ ...capacityForm, seats: event.target.value })} /></label>
            <label>Trainers<input type="number" min="0" value={capacityForm.trainerCount} onChange={(event) => setCapacityForm({ ...capacityForm, trainerCount: event.target.value })} /></label>
            <label>Trainer capabilities on hand<input value={capacityForm.trainerCapabilities} onChange={(event) => setCapacityForm({ ...capacityForm, trainerCapabilities: event.target.value })} placeholder="React, CNC operation, solar installation" /></label>
            <label>Equipment on hand<input value={capacityForm.equipmentAvailable} onChange={(event) => setCapacityForm({ ...capacityForm, equipmentAvailable: event.target.value })} placeholder="Workstations, lab kits" /></label>
            <label>Equipment readiness (%)<input type="number" min="0" max="100" value={capacityForm.equipmentReadiness} onChange={(event) => setCapacityForm({ ...capacityForm, equipmentReadiness: event.target.value })} /></label>
            <label>Infrastructure readiness (%)<input type="number" min="0" max="100" value={capacityForm.infrastructureReadiness} onChange={(event) => setCapacityForm({ ...capacityForm, infrastructureReadiness: event.target.value })} /></label>
            <button className="primary-button" disabled={busy}>{editingCapacityId ? "Update capacity" : "Save capacity"}</button>
            {editingCapacityId && <button type="button" className="secondary-button" onClick={cancelCapacityEdit}>Cancel edit</button>}
          </form>
        </section>
      )}

      {isCapacityPage && (
        <section className="chart-card module-form-card">
          <div className="card-heading"><div><h3>District plan</h3><p>Compare local demand signals with recorded courses and training capacity.</p></div><MapPinned size={18} /></div>
          <form className="module-toolbar" onSubmit={runDistrictPlan}>
            <input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Enter district name or code" required />
            <button className="secondary-button" type="submit">Generate evidence plan</button>
          </form>
          {districtPlan && (
            <div className="district-plan-results">
              <p><strong>{districtPlan.availableSeats}</strong> seats · <strong>{districtPlan.trainerCount}</strong> trainers · Equipment readiness: {districtPlan.equipmentReadiness ?? "Not reported"}%</p>
              <h4>Priority skills</h4>
              {(districtPlan.prioritySkills || []).map((item) => <div className="list-row" key={item.skillName}><span>{item.skillName}</span><span>{item.demandValue} demand</span></div>)}
              <h4>Equipment gaps</h4>
              {districtPlan.equipmentGaps?.length
                ? districtPlan.equipmentGaps.map((item) => <div className="list-row" key={item}><span>{item}</span><span className="badge warning">Not reported</span></div>)
                : <p>No equipment gaps identified from the recorded capacity and course data.</p>}
              <h4>Trainer capability gaps</h4>
              {districtPlan.trainerCapabilityGaps?.length
                ? districtPlan.trainerCapabilityGaps.map((item) => <div className="list-row" key={item}><span>{item}</span><span className="badge warning">Development needed</span></div>)
                : <p>No trainer capability gaps identified from the recorded capacity and course data.</p>}
              <h4>Recommended actions</h4>
              {(districtPlan.actions || []).map((action) => <p key={action}>{action}</p>)}
            </div>
          )}
        </section>
      )}

      {isSignalPage && (
        <section className="chart-card module-form-card">
          <div className="card-heading">
            <div><h3>Demand by role, skill and location</h3><p>Signals are shown with source and employer endorsements.</p></div>
            <TrendingUp size={18} />
          </div>
          <div className="toolbar-search module-toolbar-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()} evidence`} /></div>
          <div className="list-row">
            <span>Locations: {(demand?.topLocations || []).map((item) => `${item.location} (${item.demandValue})`).join(", ") || "No evidence"}</span>
            <span>Requested proficiency: {(demand?.proficiencyLevels || []).map((item) => `${item.proficiencyLevel} (${item.demandValue})`).join(", ") || "No evidence"}</span>
          </div>
          {visibleSignals.length ? visibleSignals.map((signal) => (
            <article className="data-row" key={signal.signalId}>
              <div className="data-main">
                <div className="row-icon"><CheckCircle2 size={18} /></div>
                <div>
                  <strong>{signal.skillName} · {signal.roleTitle}</strong>
                  <small>{signal.location}{signal.sector ? ` · ${signal.sector}` : ""} · {signal.proficiencyLevel} · {signal.sourceType}</small>
                  {signal.evidenceSummary && <small>{signal.evidenceSummary}</small>}
                </div>
              </div>
              <span className="badge success">{signal.demandValue} demand · {signal.validationCount} endorsements</span>
              {role === "recruiter" && signal.contributorId !== currentUser?.userId && (
                <button className="secondary-button" onClick={() => validateSignal(signal.signalId, "endorsed")} disabled={busy}>Validate</button>
              )}
            </article>
          )) : <p>No matching signals yet. Submit evidence to start building the local picture.</p>}
        </section>
      )}

      {isCoursePage && (
        <section className="chart-card module-form-card">
          <div className="card-heading"><div><h3>Courses and curriculum health</h3><p>Recommendations are evidence-led review prompts, not automatic curriculum changes.</p></div></div>
          {courses.length ? courses.map((course) => (
            <article className="data-row" key={course.courseId}>
              <div className="data-main">
                <div className="row-icon"><CheckCircle2 size={18} /></div>
                <div><strong>{course.courseName}</strong><small>{course.courseCode} · {course.qualification || "Qualification not specified"} · {course.targetRole} · {course.sector}</small><small>Skills: {(course.skills || []).join(", ") || "Not listed"}</small>{course.recommendedUpdate && <small>{course.recommendedUpdate}</small>}</div>
              </div>
              <span className={`badge ${course.courseStatus === "active" ? "success" : "warning"}`}>{course.courseStatus}</span>
              {course.placementRate != null && <span className="badge">Placement rate: {course.placementRate}%</span>}
              {canManageCourses && <button className="secondary-button" onClick={() => editCourse(course)} disabled={busy}>Edit course</button>}
              {canManageCourses && <button className="secondary-button" onClick={() => runCourseAnalysis(course.courseId)} disabled={busy}>Analyze demand <ArrowUpRight size={15} /></button>}
            </article>
          )) : <p>No course records have been added yet.</p>}
        </section>
      )}

      {isCapacityPage && (
        <section className="chart-card module-form-card">
          <div className="card-heading"><div><h3>Recorded training capacity</h3><p>Reported seats, trainers, equipment and infrastructure.</p></div></div>
          {capacity.length ? capacity.map((item) => (
            <article className="data-row" key={item.capacityId}>
              <div className="data-main"><div className="row-icon"><MapPinned size={18} /></div><div><strong>{item.districtId}</strong><small>{item.seats} seats · {item.trainerCount} trainers</small><small>Equipment: {item.equipmentReadiness}% · Infrastructure: {item.infrastructureReadiness}%</small><small>Trainer capabilities: {(item.trainerCapabilities || []).join(", ") || "Not reported"}</small><small>Equipment: {(item.equipmentAvailable || []).join(", ") || "Equipment not listed"}</small></div></div>
              {canManageCourses && <button className="secondary-button" onClick={() => editCapacity(item)}>Edit capacity</button>}
            </article>
          )) : <p>No capacity records have been entered yet.</p>}
        </section>
      )}

      {!isCoursePage && !isCapacityPage && !isSignalPage && !showSignalForm && title !== "Placement Feedback" && (
        <section className="chart-card module-form-card">
          <div className="card-heading"><div><h3>{title} overview</h3><p>Current evidence-backed platform totals.</p></div></div>
          <div className="list-row"><span>Job-posting signals</span><strong>{overview?.signalsBySource?.job_posting || 0}</strong></div>
          <div className="list-row"><span>Employer survey signals</span><strong>{overview?.signalsBySource?.employer_survey || 0}</strong></div>
          <div className="list-row"><span>Industry consultation signals</span><strong>{overview?.signalsBySource?.industry_consultation || 0}</strong></div>
          <div className="list-row"><span>Emerging technology signals</span><strong>{overview?.signalsBySource?.emerging_technology || 0}</strong></div>
        </section>
      )}
    </div>
  );
}
