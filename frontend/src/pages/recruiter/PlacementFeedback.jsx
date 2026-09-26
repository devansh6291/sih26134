import React, { useState } from "react";
import {
  Star,
  MessageSquareText,
  CheckCircle2,
} from "lucide-react";
import "./recruiter.css";
const candidate = {
  id: 1,
  name: "Rahul Sharma",
  role: "Full Stack Developer",
  company: "TechNova Solutions",
  status: "Shortlisted",
};

export default function PlacementFeedback() {
  const [rating, setRating] = useState(0);
  const [courseRelevance, setCourseRelevance] =
    useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!rating) {
      alert("Please select a candidate rating.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="recruiter-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            RECRUITER
          </span>

          <h1>Placement Feedback</h1>

          <p>
            Share feedback about the candidate after
            the recruitment process.
          </p>
        </div>
      </div>

      {!submitted ? (
        <div className="feedback-container">
          <div className="feedback-info">
            <div className="feedback-info-icon">
              <MessageSquareText size={22} />
            </div>

            <div>
              <h3>
                Candidate Placement Feedback
              </h3>

              <p>
                Your feedback helps KAUSHAL understand
                candidate readiness and course relevance.
              </p>
            </div>
          </div>

          <div className="feedback-candidate-card">
            <div className="feedback-avatar">
              {candidate.name.charAt(0)}
            </div>

            <div>
              <h2>{candidate.name}</h2>

              <p>{candidate.role}</p>

              <span>{candidate.company}</span>
            </div>

            <div className="feedback-status">
              {candidate.status}
            </div>
          </div>

          <form
            className="feedback-form"
            onSubmit={handleSubmit}
          >
            <div className="rating-section">
              <label>
                Candidate Readiness
              </label>

              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={
                      star <= rating
                        ? "star active"
                        : "star"
                    }
                    onClick={() =>
                      setRating(star)
                    }
                  >
                    <Star
                      size={28}
                      fill={
                        star <= rating
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                ))}
              </div>

              <span className="rating-label">
                {rating === 0
                  ? "Select rating"
                  : `${rating} out of 5`}
              </span>
            </div>

            <div className="rating-section">
              <label>
                Course Relevance
              </label>

              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={
                      star <= courseRelevance
                        ? "star active"
                        : "star"
                    }
                    onClick={() =>
                      setCourseRelevance(star)
                    }
                  >
                    <Star
                      size={28}
                      fill={
                        star <= courseRelevance
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                ))}
              </div>

              <span className="rating-label">
                {courseRelevance === 0
                  ? "Select rating"
                  : `${courseRelevance} out of 5`}
              </span>
            </div>

            <div className="form-group">
              <label>
                Recruiter Feedback
              </label>

              <textarea
                rows="6"
                value={feedback}
                onChange={(e) =>
                  setFeedback(e.target.value)
                }
                placeholder="Share your observations about the candidate's skills, readiness and areas for improvement..."
              />
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="primary-button"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="feedback-success">
          <div className="feedback-success-icon">
            <CheckCircle2 size={42} />
          </div>

          <h2>Feedback Submitted</h2>

          <p>
            Your feedback for{" "}
            <strong>{candidate.name}</strong>{" "}
            has been recorded successfully.
          </p>

          <div className="submitted-rating">
            <span>Candidate Readiness</span>

            <strong>
              {rating}/5
            </strong>
          </div>

          <div className="submitted-rating">
            <span>Course Relevance</span>

            <strong>
              {courseRelevance || 0}/5
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}