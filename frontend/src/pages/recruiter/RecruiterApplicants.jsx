
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Mail,
  Phone,
  FileText,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getRecruiterApplications,
  updateApplicationStatus,
} from "../../services/api";
import "./recruiter.css";

export default function RecruiterApplicants() {
  const [candidates, setCandidates] = useState([]);
  const [showCV, setShowCV] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState(null);
  const [search, setSearch] = useState("");

  const loadApplications = useCallback(async () => {
    setCandidates(await getRecruiterApplications());
  }, []);

  useEffect(() => {
    loadApplications().catch((error) => alert(error.message));
    const refreshInterval = window.setInterval(() => {
      loadApplications().catch((error) =>
        console.error("Failed to refresh applications:", error)
      );
    }, 15000);
    return () => window.clearInterval(refreshInterval);
  }, [loadApplications]);

  const filteredCandidates = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      return (
        candidate.candidateName
          ?.toLowerCase()
          .includes(query) ||
        candidate.candidateEmail
          ?.toLowerCase()
          .includes(query) ||
        candidate.candidateRole
          ?.toLowerCase()
          .includes(query) ||
        candidate.skills?.some((skill) =>
          skill.toLowerCase().includes(query)
        )
      );
    });
  }, [candidates, search]);

  const updateStatus = async (applicationId, status) => {
    try {
      const updatedApplication = await updateApplicationStatus(
        applicationId,
        status
      );
      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.id === applicationId
            ? updatedApplication
            : candidate
        )
      );
      setSelectedCandidate((prev) =>
        prev && prev.id === applicationId
          ? updatedApplication
          : prev
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const openCV = (candidate) => {
    setSelectedCandidate(candidate);
    setShowCV(true);
  };

  const closeCV = () => {
    setShowCV(false);
    setSelectedCandidate(null);
  };

  const totalApplicants = candidates.length;

  const shortlistedCount = candidates.filter(
    (candidate) =>
      candidate.status === "Shortlisted"
  ).length;

  const underReviewCount = candidates.filter(
    (candidate) =>
      candidate.status === "Under Review"
  ).length;

  return (
    <div className="recruiter-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            RECRUITER
          </span>

          <h1>Candidates</h1>

          <p>
            Review candidates who applied to your jobs.
          </p>
        </div>
      </div>

      <div className="candidate-summary">
        <div className="candidate-summary-card">
          <span>Total Applicants</span>
          <strong>{totalApplicants}</strong>
        </div>

        <div className="candidate-summary-card">
          <span>Shortlisted</span>
          <strong>{shortlistedCount}</strong>
        </div>

        <div className="candidate-summary-card">
          <span>Under Review</span>
          <strong>{underReviewCount}</strong>
        </div>
      </div>

      <div className="candidate-toolbar">
        <div className="candidate-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search candidate or skill..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {filteredCandidates.length > 0 ? (
        filteredCandidates.map((candidate) => (
          <article
            className="candidate-card"
            key={candidate.id}
          >
            <div className="candidate-avatar">
              {(
                candidate.candidateName || "C"
              ).charAt(0)}
            </div>

            <div className="candidate-main">
              <div className="candidate-name-row">
                <div>
                  <h3>
                    {candidate.candidateName}
                  </h3>

                  <p>
                    {candidate.candidateRole}
                  </p>
                </div>

                <span className="candidate-status">
                  {candidate.status}
                </span>
              </div>

              <div className="candidate-meta">
                {candidate.location && (
                  <span>
                    <MapPin size={14} />
                    {candidate.location}
                  </span>
                )}

                <span>
                  <Mail size={14} />
                  {candidate.candidateEmail}
                </span>
              </div>

              <div className="candidate-skills">
                {(candidate.skills || []).map(
                  (skill) => (
                    <span key={skill}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="candidate-readiness">
              <span>Readiness</span>

              <strong>
                {candidate.readiness ?? 0}%
              </strong>

              <div className="readiness-bar">
                <div
                  style={{
                    width: `${
                      candidate.readiness ?? 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="candidate-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  openCV(candidate)
                }
              >
                <FileText size={16} />
                View CV
              </button>

              {candidate.status !==
                "Shortlisted" && (
                <button
                  className="primary-button"
                  onClick={() =>
                    updateStatus(
                      candidate.id,
                      "Shortlisted"
                    )
                  }
                >
                  <CheckCircle2 size={16} />
                  Shortlist
                </button>
              )}
            </div>
          </article>
        ))
      ) : (
        <div className="empty-state">
          <h3>
            {candidates.length === 0
              ? "No applications yet"
              : "No candidate found"}
          </h3>

          <p>
            {candidates.length === 0
              ? "Candidates who apply to your jobs will appear here."
              : "Try searching with another name or skill."}
          </p>
        </div>
      )}

      {showCV && selectedCandidate && (
        <div className="modal-overlay">
          <div className="cv-modal">
            <div className="modal-header">
              <div>
                <span className="page-eyebrow">
                  CANDIDATE CV
                </span>

                <h2>
                  {selectedCandidate.candidateName}
                </h2>

                <p>
                  {selectedCandidate.candidateRole}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeCV}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cv-profile-header">
              <div className="cv-avatar">
                {selectedCandidate.candidateName?.charAt(
                  0
                )}
              </div>

              <div>
                <h3>
                  {selectedCandidate.candidateName}
                </h3>

                <div className="cv-contact">
                  {selectedCandidate.candidateEmail && (
                    <span>
                      <Mail size={14} />
                      {
                        selectedCandidate.candidateEmail
                      }
                    </span>
                  )}

                  {selectedCandidate.phone && (
                    <span>
                      <Phone size={14} />
                      {selectedCandidate.phone}
                    </span>
                  )}

                  {selectedCandidate.location && (
                    <span>
                      <MapPin size={14} />
                      {selectedCandidate.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedCandidate.summary && (
              <div className="cv-section">
                <h3>Professional Summary</h3>

                <p>
                  {selectedCandidate.summary}
                </p>
              </div>
            )}

            <div className="cv-section">
              <h3>Skills</h3>

              <div className="candidate-skills cv-skills">
                {(selectedCandidate.skills || []).map(
                  (skill) => (
                    <span key={skill}>
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="cv-details-grid">
              {selectedCandidate.experience && (
                <div className="cv-section">
                  <h3>Experience</h3>

                  <p>
                    {selectedCandidate.experience}
                  </p>
                </div>
              )}

              {selectedCandidate.education && (
                <div className="cv-section">
                  <h3>Education</h3>

                  <p>
                    {selectedCandidate.education}
                  </p>
                </div>
              )}
            </div>

            <div className="cv-section">
              <h3>Readiness Score</h3>

              <div className="cv-readiness">
                <strong>
                  {selectedCandidate.readiness ??
                    0}
                  %
                </strong>

                <div className="readiness-bar">
                  <div
                    style={{
                      width: `${
                        selectedCandidate.readiness ??
                        0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {selectedCandidate.resume && (
              <div className="cv-file">
                <FileText size={20} />

                <div>
                  <strong>
                    {selectedCandidate.resume}
                  </strong>

                  <span>Candidate CV</span>
                </div>

                <button className="secondary-button">
                  Open CV
                </button>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="danger-button"
                onClick={() =>
                  updateStatus(
                    selectedCandidate.id,
                    "Rejected"
                  )
                }
              >
                <XCircle size={16} />
                Reject
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  updateStatus(
                    selectedCandidate.id,
                    "Shortlisted"
                  )
                }
              >
                <CheckCircle2 size={16} />
                Shortlist Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
