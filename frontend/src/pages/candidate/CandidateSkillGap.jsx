import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Target,
  TrendingUp,
} from "lucide-react";
import { getCandidateGuidance } from "../../services/api";
import "./candidate.css";

export default function CandidateSkillGap() {
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState("");

  const loadGuidance = useCallback(async () => {
    setError("");
    try {
      setGuidance(await getCandidateGuidance());
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    loadGuidance();
  }, [loadGuidance]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow dark">PERSONALIZED SKILL INTELLIGENCE</div>
          <h1>My Skill Gap</h1>
          <p>
            Compare your saved skills with role and location demand recorded
            from employer and labour-market evidence.
          </p>
        </div>
        <div className="date-pill">
          <Target size={16} /> {guidance?.location || "Location not set"}
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {!guidance && !error && <p role="status">Loading your evidence-based guidance...</p>}

      {guidance && (
        <>
          <div className="skill-overview-grid">
            <div className="skill-overview-card">
              <div className="skill-card-icon"><TrendingUp size={21} /></div>
              <span>Skills in your profile</span>
              <strong>{guidance.currentSkills.length}</strong>
              <p>From your saved candidate profile.</p>
            </div>
            <div className="skill-overview-card">
              <div className="skill-card-icon"><AlertTriangle size={21} /></div>
              <span>Priority opportunities</span>
              <strong>{guidance.prioritySkillGaps.length}</strong>
              <p>Demanded skills not currently in your profile.</p>
            </div>
            <div className="skill-overview-card">
              <div className="skill-card-icon"><BookOpen size={21} /></div>
              <span>Matching courses</span>
              <strong>{guidance.recommendedCourses.length}</strong>
              <p>Active courses covering one or more priority skills.</p>
            </div>
          </div>

          <section className="chart-card module-form-card">
            <div className="card-heading"><div><h3>Skills already in your profile</h3><p>Keep your registered profile up to date for more relevant recommendations.</p></div></div>
            {guidance.currentSkills.length ? (
              <div className="candidate-skills">
                {guidance.currentSkills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            ) : (
              <p>No skills are recorded in your profile yet. Add skills when creating/updating your candidate account.</p>
            )}
          </section>

          <section className="chart-card module-form-card">
            <div className="card-heading"><div><h3>Priority skills to develop</h3><p>Based on current demand signals for your saved location.</p></div></div>
            {guidance.prioritySkillGaps.length ? guidance.prioritySkillGaps.map((skill) => (
              <div className="list-row" key={skill}>
                <span>{skill}</span><span className="badge warning">Demand evidence</span>
              </div>
            )) : <p>No skill gaps found in the signals currently available for your location.</p>}
          </section>

          <section className="chart-card module-form-card">
            <div className="card-heading"><div><h3>Course recommendations</h3><p>Recommendations connect recorded course curricula to the priority skills above.</p></div></div>
            {guidance.recommendedCourses.length ? guidance.recommendedCourses.map((course) => (
              <article className="data-row" key={course.courseId}>
                <div className="data-main">
                  <div className="row-icon"><CheckCircle2 size={18} /></div>
                  <div><strong>{course.courseName}</strong><small>Target role: {course.targetRole}</small><small>Priority skills: {course.matchingSkills.join(", ")}</small></div>
                </div>
              </article>
            )) : <p>No active course currently covers your recorded priority skill gaps.</p>}
          </section>
        </>
      )}
    </div>
  );
}
