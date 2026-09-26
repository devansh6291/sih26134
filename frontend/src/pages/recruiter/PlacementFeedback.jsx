import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, MessageSquareText, Star } from "lucide-react";
import { createPlacementOutcome, getCourses } from "../../services/api";
import "./recruiter.css";

const initialForm = {
  roleTitle: "",
  sector: "",
  districtId: "",
  courseId: "",
  placed: "true",
  employerRating: "",
  courseRelevanceScore: "",
  feedbackNotes: "",
};

export default function PlacementFeedback() {
  const [form, setForm] = useState(initialForm);
  const [courses, setCourses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      setCourses(await getCourses());
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await createPlacementOutcome({
        ...form,
        placed: form.placed === "true",
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="recruiter-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">RECRUITER</span>
          <h1>Placement Feedback</h1>
          <p>Record real placement outcomes and employer feedback to improve local training plans.</p>
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {submitted ? (
        <div className="feedback-success">
          <div className="feedback-success-icon"><CheckCircle2 size={42} /></div>
          <h2>Outcome recorded</h2>
          <p>Your placement outcome and feedback have been saved for labour-market analysis.</p>
          <button className="primary-button" type="button" onClick={() => { setForm(initialForm); setSubmitted(false); }}>
            Record another outcome
          </button>
        </div>
      ) : (
        <div className="feedback-container">
          <div className="feedback-info">
            <div className="feedback-info-icon"><MessageSquareText size={22} /></div>
            <div>
              <h3>Employer outcome report</h3>
              <p>Only submit verified, aggregated learning and placement feedback. Avoid entering candidate-sensitive personal information.</p>
            </div>
          </div>
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="feedback-role">Role title</label>
                <input id="feedback-role" name="roleTitle" value={form.roleTitle} onChange={update} required maxLength={255} />
              </div>
              <div className="form-group">
                <label htmlFor="feedback-sector">Sector (optional)</label>
                <input id="feedback-sector" name="sector" value={form.sector} onChange={update} maxLength={150} />
              </div>
              <div className="form-group">
                <label htmlFor="feedback-district">District</label>
                <input id="feedback-district" name="districtId" value={form.districtId} onChange={update} required maxLength={100} />
              </div>
              <div className="form-group">
                <label htmlFor="feedback-course">Related course (optional)</label>
                <select id="feedback-course" name="courseId" value={form.courseId} onChange={update}>
                  <option value="">Not specified</option>
                  {courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.courseName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="feedback-placement-status">Placement outcome</label>
                <select id="feedback-placement-status" name="placed" value={form.placed} onChange={update}>
                  <option value="true">Placed</option>
                  <option value="false">Not placed</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="feedback-rating"><Star size={15} /> Employer readiness rating (optional, 1-5)</label>
                <input id="feedback-rating" name="employerRating" type="number" min="1" max="5" step="0.1" value={form.employerRating} onChange={update} />
              </div>
              <div className="form-group">
                <label htmlFor="feedback-relevance">Course relevance (optional, 0-100)</label>
                <input id="feedback-relevance" name="courseRelevanceScore" type="number" min="0" max="100" step="1" value={form.courseRelevanceScore} onChange={update} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="feedback-notes">Feedback and skill observations (optional)</label>
              <textarea id="feedback-notes" name="feedbackNotes" rows="5" maxLength={5000} value={form.feedbackNotes} onChange={update} placeholder="Describe role-relevant strengths, skills to improve, or course relevance. Do not include names or contact details." />
            </div>
            <div className="modal-actions">
              <button type="submit" className="primary-button" disabled={busy}>
                {busy ? "Saving..." : "Submit outcome"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
