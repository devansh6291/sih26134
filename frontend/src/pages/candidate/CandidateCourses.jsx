import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Clock3,
  CheckCircle2,
  PlayCircle,
  Search,
  Award,
  TrendingUp,
} from "lucide-react";
import "./candidate.css";
const COURSES = [
  {
    id: 1,
    title: "Express.js & REST API Development",
    category: "Backend",
    level: "Intermediate",
    duration: "4 weeks",
    skills: ["Express.js", "REST API", "Node.js"],
    progress: 72,
    status: "In Progress",
    credits: 8,
    recommended: true,
  },
  {
    id: 2,
    title: "PostgreSQL for Developers",
    category: "Database",
    level: "Intermediate",
    duration: "3 weeks",
    skills: ["PostgreSQL", "SQL", "Database"],
    progress: 35,
    status: "In Progress",
    credits: 6,
    recommended: true,
  },
  {
    id: 3,
    title: "TypeScript Fundamentals",
    category: "Frontend",
    level: "Beginner",
    duration: "2 weeks",
    skills: ["TypeScript", "JavaScript"],
    progress: 0,
    status: "Not Started",
    credits: 5,
    recommended: true,
  },
  {
    id: 4,
    title: "React Advanced Development",
    category: "Frontend",
    level: "Advanced",
    duration: "5 weeks",
    skills: ["React", "Hooks", "Performance"],
    progress: 100,
    status: "Completed",
    credits: 10,
    recommended: false,
  },
  {
    id: 5,
    title: "Docker Essentials",
    category: "DevOps",
    level: "Beginner",
    duration: "2 weeks",
    skills: ["Docker", "Containers", "DevOps"],
    progress: 0,
    status: "Not Started",
    credits: 5,
    recommended: true,
  },
  {
    id: 6,
    title: "Git & Collaborative Development",
    category: "Tools",
    level: "Beginner",
    duration: "1 week",
    skills: ["Git", "GitHub", "Collaboration"],
    progress: 100,
    status: "Completed",
    credits: 4,
    recommended: false,
  },
];

export default function CandidateCourses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("All");

  const filteredCourses = useMemo(() => {
    let result = [...COURSES];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.skills.some((skill) =>
            skill.toLowerCase().includes(query)
          )
      );
    }

    if (category !== "All") {
      result = result.filter(
        (course) => course.category === category
      );
    }

    if (activeTab === "Recommended") {
      result = result.filter((course) => course.recommended);
    }

    if (activeTab === "In Progress") {
      result = result.filter(
        (course) => course.status === "In Progress"
      );
    }

    if (activeTab === "Completed") {
      result = result.filter(
        (course) => course.status === "Completed"
      );
    }

    return result;
  }, [search, category, activeTab]);

  const completedCourses = COURSES.filter(
    (course) => course.status === "Completed"
  ).length;

  const inProgressCourses = COURSES.filter(
    (course) => course.status === "In Progress"
  ).length;

  const totalCredits = COURSES.filter(
    (course) => course.status === "Completed"
  ).reduce((total, course) => total + course.credits, 0);

  const handleCourseAction = (course) => {
    if (course.status === "Completed") {
      alert(`${course.title} is already completed.`);
      return;
    }

    if (course.status === "In Progress") {
      alert(`Continue learning: ${course.title}`);
      return;
    }

    alert(`Starting course: ${course.title}`);
  };

  return (
    <div className="page-container">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow dark">
            PERSONALIZED LEARNING
          </div>

          <h1>My Courses</h1>

          <p>
            Learn the skills needed to close your gaps and
            move toward your target career.
          </p>
        </div>

        <div className="date-pill">
          {COURSES.length} courses
        </div>
      </div>

      {/* STATS */}
      <div className="course-overview-grid">

        <div className="course-overview-card">
          <div className="course-stat-icon">
            <BookOpen size={20} />
          </div>

          <span>Total Courses</span>

          <strong>{COURSES.length}</strong>

          <p>Available in your learning path</p>
        </div>

        <div className="course-overview-card">
          <div className="course-stat-icon">
            <PlayCircle size={20} />
          </div>

          <span>In Progress</span>

          <strong>{inProgressCourses}</strong>

          <p>Courses currently being learned</p>
        </div>

        <div className="course-overview-card">
          <div className="course-stat-icon">
            <CheckCircle2 size={20} />
          </div>

          <span>Completed</span>

          <strong>{completedCourses}</strong>

          <p>Courses successfully completed</p>
        </div>

        <div className="course-overview-card">
          <div className="course-stat-icon">
            <Award size={20} />
          </div>

          <span>Credits Earned</span>

          <strong>{totalCredits}</strong>

          <p>Learning credits unlocked</p>
        </div>

      </div>

      {/* SEARCH + FILTER */}
      <div className="course-toolbar">

        <div className="course-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search courses or skills..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          <option value="All">All Categories</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Database">Database</option>
          <option value="DevOps">DevOps</option>
          <option value="Tools">Tools</option>
        </select>

      </div>

      {/* TABS */}
      <div className="course-tabs">

        {[
          "All",
          "Recommended",
          "In Progress",
          "Completed",
        ].map((tab) => (
          <button
            key={tab}
            className={
              activeTab === tab
                ? "course-tab active"
                : "course-tab"
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}

      </div>

      {/* RECOMMENDATION BANNER */}
      {activeTab === "All" ||
      activeTab === "Recommended" ? (
        <div className="learning-banner">

          <div className="learning-banner-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <strong>
              Learning based on your Skill Gap
            </strong>

            <p>
              These courses are recommended based on the
              skills required for your target role.
            </p>
          </div>

        </div>
      ) : null}

      {/* COURSE GRID */}
      {filteredCourses.length > 0 ? (
        <div className="courses-grid">

          {filteredCourses.map((course) => (
            <article
              className="course-card"
              key={course.id}
            >

              {/* COURSE HEADER */}
              <div className="course-card-header">

                <div className="course-icon">
                  <BookOpen size={21} />
                </div>

                {course.recommended && (
                  <span className="recommended-badge">
                    Recommended
                  </span>
                )}

              </div>

              {/* COURSE INFO */}
              <div className="course-category">
                {course.category}
              </div>

              <h3>{course.title}</h3>

              <div className="course-details">

                <span>
                  <Clock3 size={14} />
                  {course.duration}
                </span>

                <span>
                  {course.level}
                </span>

              </div>

              {/* SKILLS */}
              <div className="course-skills">

                {course.skills.map((skill) => (
                  <span key={skill}>
                    {skill}
                  </span>
                ))}

              </div>

              {/* PROGRESS */}
              <div className="course-progress-section">

                <div className="course-progress-header">

                  <span>
                    {course.status}
                  </span>

                  <strong>
                    {course.progress}%
                  </strong>

                </div>

                <div className="course-progress-bar">
                  <div
                    style={{
                      width: `${course.progress}%`,
                    }}
                  />
                </div>

              </div>

              {/* FOOTER */}
              <div className="course-card-footer">

                <div className="course-credit">
                  <Award size={15} />

                  {course.credits} Credits
                </div>

                <button
                  className={
                    course.status === "Completed"
                      ? "secondary-button"
                      : "primary-button"
                  }
                  onClick={() =>
                    handleCourseAction(course)
                  }
                >
                  {course.status === "Completed"
                    ? "Completed"
                    : course.status === "In Progress"
                    ? "Continue"
                    : "Start Learning"}
                </button>

              </div>

            </article>
          ))}

        </div>
      ) : (
        <div className="courses-empty">

          <BookOpen size={35} />

          <h3>No courses found</h3>

          <p>
            Try changing your search or category filter.
          </p>

        </div>
      )}

    </div>
  );
}