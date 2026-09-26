import React, { useCallback, useEffect, useState } from "react";
import { BookOpen, MapPin, RefreshCw } from "lucide-react";
import { getCandidateGuidance, getCourses } from "../../services/api";
import "./candidate.css";

export default function CandidateCourses() {
  const [courses, setCourses] = useState([]);
  const [guidance, setGuidance] = useState(null);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    setError("");
    try {
      const [courseRows, candidateGuidance] = await Promise.all([
        getCourses({ courseStatus: "active" }),
        getCandidateGuidance(),
      ]);
      setCourses(courseRows);
      setGuidance(candidateGuidance);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const recommendations = new Set(
    guidance?.recommendedCourses.map((course) => course.courseId) || [],
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow dark">LEARNING PATHWAYS</div>
          <h1>Explore Courses</h1>
          <p>Browse active training offerings and see which ones address demand-backed skill gaps in your profile.</p>
        </div>
        <button className="secondary-button" type="button" onClick={loadCourses}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {!guidance && !error && <p role="status">Loading active courses...</p>}
      {guidance && <p className="date-pill"><MapPin size={15} /> Recommendations for {guidance.location || "your profile location"}</p>}

      <div className="course-grid">
        {courses.map((course) => (
          <article className="chart-card course-card" key={course.courseId}>
            <div className="row-icon"><BookOpen size={19} /></div>
            <div>
              <h3>{course.courseName}</h3>
              <p>{course.targetRole}</p>
            </div>
            <div className="candidate-skills">
              {course.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
            <div className="list-row">
              <span>{course.durationHours ? `${course.durationHours} training hours` : "Duration not specified"}</span>
              <span className={recommendations.has(course.courseId) ? "badge success" : "badge"}>
                {recommendations.has(course.courseId) ? "Recommended for your skill gaps" : "Active course"}
              </span>
            </div>
          </article>
        ))}
      </div>
      {guidance && courses.length === 0 && <p>No active course offerings are available yet.</p>}
    </div>
  );
}
