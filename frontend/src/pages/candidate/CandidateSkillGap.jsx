import React, { useMemo, useState } from "react";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  BriefcaseBusiness,
} from "lucide-react";
import "./candidate.css";
const ROLE_DATA = {
  "Full Stack Developer": {
    readiness: 72,

    currentSkills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
    ],

    requiredSkills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
      "Express.js",
      "PostgreSQL",
      "TypeScript",
      "Docker",
    ],

    recommendations: [
      {
        title: "Express.js & REST API Development",
        type: "Backend",
        duration: "4 weeks",
        level: "Intermediate",
      },
      {
        title: "PostgreSQL for Developers",
        type: "Database",
        duration: "3 weeks",
        level: "Intermediate",
      },
      {
        title: "TypeScript Fundamentals",
        type: "Frontend",
        duration: "2 weeks",
        level: "Beginner",
      },
      {
        title: "Docker Essentials",
        type: "DevOps",
        duration: "2 weeks",
        level: "Beginner",
      },
    ],
  },

  "React Developer": {
    readiness: 78,

    currentSkills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Git",
    ],

    requiredSkills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Git",
      "TypeScript",
      "Redux",
      "React Testing",
      "REST APIs",
    ],

    recommendations: [
      {
        title: "TypeScript with React",
        type: "Frontend",
        duration: "3 weeks",
        level: "Intermediate",
      },
      {
        title: "Redux & State Management",
        type: "Frontend",
        duration: "2 weeks",
        level: "Intermediate",
      },
      {
        title: "React Testing",
        type: "Testing",
        duration: "2 weeks",
        level: "Intermediate",
      },
    ],
  },

  "Data Analyst": {
    readiness: 64,

    currentSkills: [
      "Python",
      "SQL",
      "Excel",
      "Statistics",
    ],

    requiredSkills: [
      "Python",
      "SQL",
      "Excel",
      "Statistics",
      "Power BI",
      "Pandas",
      "Data Visualization",
      "Machine Learning Basics",
    ],

    recommendations: [
      {
        title: "Power BI for Data Analytics",
        type: "Analytics",
        duration: "3 weeks",
        level: "Beginner",
      },
      {
        title: "Python Pandas",
        type: "Python",
        duration: "2 weeks",
        level: "Intermediate",
      },
      {
        title: "Data Visualization",
        type: "Analytics",
        duration: "2 weeks",
        level: "Intermediate",
      },
    ],
  },
};

export default function CandidateSkillGap() {
  const [selectedRole, setSelectedRole] =
    useState("Full Stack Developer");

  const roleData = ROLE_DATA[selectedRole];

  const missingSkills = useMemo(() => {
    return roleData.requiredSkills.filter(
      (skill) => !roleData.currentSkills.includes(skill)
    );
  }, [roleData]);

  const matchedSkills = useMemo(() => {
    return roleData.requiredSkills.filter(
      (skill) => roleData.currentSkills.includes(skill)
    );
  }, [roleData]);

  const gapPercentage = Math.round(
    (missingSkills.length /
      roleData.requiredSkills.length) *
      100
  );

  return (
    <div className="page-container">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow dark">
            PERSONALIZED SKILL INTELLIGENCE
          </div>

          <h1>My Skill Gap</h1>

          <p>
            Understand your current skills, identify missing
            skills, and follow a personalized learning path.
          </p>
        </div>

        <div className="date-pill">
          {roleData.readiness}% Ready
        </div>
      </div>

      {/* TARGET ROLE */}
      <div className="skill-gap-toolbar">
        <div>
          <label>Target Career Role</label>

          <div className="skill-role-selector">
            <Target size={18} />

            <select
              value={selectedRole}
              onChange={(event) =>
                setSelectedRole(event.target.value)
              }
            >
              {Object.keys(ROLE_DATA).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* OVERVIEW */}
      <div className="skill-overview-grid">

        <div className="skill-overview-card">
          <div className="skill-card-icon">
            <TrendingUp size={21} />
          </div>

          <span>Skill Readiness</span>

          <strong>{roleData.readiness}%</strong>

          <div className="skill-progress">
            <div
              style={{
                width: `${roleData.readiness}%`,
              }}
            />
          </div>

          <p>
            Your current profile matches the requirements
            for this role.
          </p>
        </div>

        <div className="skill-overview-card">
          <div className="skill-card-icon">
            <CheckCircle2 size={21} />
          </div>

          <span>Matched Skills</span>

          <strong>{matchedSkills.length}</strong>

          <p>
            Skills already present in your profile.
          </p>
        </div>

        <div className="skill-overview-card">
          <div className="skill-card-icon warning-icon">
            <AlertTriangle size={21} />
          </div>

          <span>Skill Gaps</span>

          <strong>{missingSkills.length}</strong>

          <p>
            Skills recommended for your target role.
          </p>
        </div>

        <div className="skill-overview-card">
          <div className="skill-card-icon">
            <BriefcaseBusiness size={21} />
          </div>

          <span>Role Alignment</span>

          <strong>{100 - gapPercentage}%</strong>

          <p>
            Alignment based on current skill coverage.
          </p>
        </div>

      </div>

      {/* SKILL LISTS */}
      <div className="skill-columns">

        {/* CURRENT SKILLS */}
        <section className="skill-panel">

          <div className="skill-panel-header">
            <div>
              <h2>Current Skills</h2>

              <p>
                Skills currently present in your profile.
              </p>
            </div>

            <span className="mini-badge success">
              {matchedSkills.length} matched
            </span>
          </div>

          <div className="skill-tag-list">
            {roleData.currentSkills.map((skill) => (
              <span
                key={skill}
                className="skill-tag matched"
              >
                <CheckCircle2 size={14} />

                {skill}
              </span>
            ))}
          </div>

        </section>

        {/* SKILL GAPS */}
        <section className="skill-panel">

          <div className="skill-panel-header">
            <div>
              <h2>Skill Gaps</h2>

              <p>
                Skills you can develop for this role.
              </p>
            </div>

            <span className="mini-badge warning">
              {missingSkills.length} to learn
            </span>
          </div>

          <div className="skill-tag-list">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="skill-tag missing"
              >
                <AlertTriangle size={14} />

                {skill}
              </span>
            ))}
          </div>

        </section>

      </div>

      {/* RECOMMENDATIONS */}
      <section className="recommendation-section">

        <div className="section-heading">
          <div>
            <div className="eyebrow dark">
              PERSONALIZED LEARNING
            </div>

            <h2>Recommended Learning</h2>

            <p>
              Courses selected to help close your current
              skill gaps.
            </p>
          </div>

          <BookOpen size={25} />
        </div>

        <div className="recommendation-grid">

          {roleData.recommendations.map((course) => (
            <article
              className="recommendation-card"
              key={course.title}
            >
              <div className="recommendation-icon">
                <BookOpen size={20} />
              </div>

              <div className="recommendation-content">

                <span className="course-type">
                  {course.type}
                </span>

                <h3>{course.title}</h3>

                <div className="course-meta">
                  <span>
                    {course.duration}
                  </span>

                  <span>
                    {course.level}
                  </span>
                </div>

                <button className="secondary-button">
                  View Course
                </button>

              </div>
            </article>
          ))}

        </div>

      </section>

    </div>
  );
}