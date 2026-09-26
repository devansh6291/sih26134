# KAUSHAL SQLAlchemy and API Contract

This document describes the integrated job-posting and application workflow in
this repository. The existing FastAPI application uses SQLAlchemy 2-style ORM
models and `Integer` user IDs. Do not replace these IDs with UUIDs or create a
second users table.

## Database target and current data

- SQLite is the agreed database for development and this project delivery.
- `DATABASE_URL` in `.env.example` uses `sqlite:///./kaushal.db`. SQLite is
  built into Python and needs no additional database driver.
- The checked-in SQLite database was inspected read-only: SQLite reported
  `integrity_check = ok` and no foreign-key violations.
- `Base.metadata.create_all()` creates missing tables but does not modify
  existing columns or migrate data. It is not a replacement for schema
  migrations. Startup applies an additive migration for the
  `training_capacity.trainer_capabilities` column when needed. Back up the
  database before schema/data migration.
- `kaushal.db` is file-based. Keep it out of source control if it contains
  real user data; share schema and seed data instead of personal database rows.

## Existing account/profile model

The existing tables remain authoritative:

| Table | Purpose |
|---|---|
| `users` | `user_id` integer PK, email, password hash, full name, role |
| `candidate_profiles` | candidate readiness, skills JSON in `skill_gap_profile`, location |
| `recruiter_profiles` | organization name and hiring domains |

Candidate skills are read from `candidate_profiles.skill_gap_profile["skills"]`.
Candidate registration writes the supplied skills into that JSON field. Phone,
resume, education, and experience are not currently stored by the existing
candidate profile model; the recruiter API returns them as `null` until the
team adds fields and migrations for them.

Roles in the API/database are lowercase snake case where applicable:
`candidate`, `recruiter`, `trainer`, `mentor`, `institute_admin`, and
`policy_officer`. The frontend maps `institute_admin` and `policy_officer` to
its route keys `instituteAdmin` and `policyOfficer`.

## Job workflow tables

Defined in `app/models/jobs.py`; integer PK/FKs match `users.user_id`.

### `jobs`

- `job_id` primary key
- `recruiter_id` FK to `users.user_id`
- `title`, `company`, `location`, `job_type`, `experience`, `salary`
- `skills` JSON array and `description`
- `status`: `active` or `closed`
- publication, creation, and update timestamps
- indexed recruiter, title, location, and status

`JobPosting` in the existing `job_postings` table is the separate
labour-market-intelligence feed (`/api/intelligence/jobs`). It is not the
recruiter's job-board table.

### `job_applications`

- `application_id` primary key
- `job_id` FK to `jobs.job_id`
- `candidate_id` FK to `users.user_id`
- `status`: `under_review`, `shortlisted`, or `rejected`
- applied and updated timestamps
- unique constraint on `(job_id, candidate_id)` prevents duplicate applies

### `application_events`

Stores initial application and later status history: application, actor,
old/new status, optional note, and timestamp.

### `notifications`

Stores new-application notifications for recruiters and status-change
notifications for candidates, including read state.

## API contract

Base URL defaults to `http://localhost:8000/api`. The Pydantic base schema
serializes snake_case fields as camelCase. The frontend sends and reads
camelCase JSON.

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Registration fields: `email`, `password`, `fullName`, `roleType`, and optional
`orgName`, `locationPref`, `skills`. Password minimum is eight characters.
Login and registration return `accessToken`, `tokenType`, `userId`,
`roleType`, `fullName`, and `email`. Send the token on subsequent requests:

```http
Authorization: Bearer <accessToken>
```

`GET /api/auth/me` returns the current account/profile summary. The frontend
does not send candidate or recruiter IDs to perform protected operations; the
backend derives identity and role from the verified token.

### Candidate jobs and applications

```http
GET  /api/jobs?search=developer&location=Bangalore&type=Full%20Time
GET  /api/jobs/{jobId}
POST /api/jobs/{jobId}/apply
GET  /api/me/applications
GET  /api/me/notifications?unreadOnly=true
PATCH /api/me/notifications/{notificationId}/read
```

`GET /api/jobs` returns active jobs only. Applying accepts an optional JSON
body such as `{"coverNote":"Interested in this role."}`. Candidate identity is
from the token. Duplicate applications return HTTP `409`; a missing or
inactive job returns `404`.

Example job item:

```json
{
  "jobId": 18,
  "recruiterId": 4,
  "title": "Full Stack Developer",
  "company": "TechNova Solutions",
  "location": "Bangalore",
  "jobType": "Full Time",
  "experience": "0-2 Years",
  "salary": "₹6-10 LPA",
  "skills": ["React", "Node.js"],
  "description": "Build web applications.",
  "status": "active",
  "publishedAt": "2026-09-26T10:00:00",
  "applicantCount": 2
}
```

Example candidate application item:

```json
{
  "applicationId": 35,
  "job": {
    "jobId": 18,
    "title": "Full Stack Developer",
    "company": "TechNova Solutions"
  },
  "status": "shortlisted",
  "appliedAt": "2026-09-26T10:15:00",
  "updatedAt": "2026-09-26T11:00:00"
}
```

The frontend displays `shortlisted` as **Selected by recruiter**. Candidate
applications refresh periodically while the page is open, and also refresh
when it is reopened.

### Recruiter job management and applicants

```http
POST  /api/recruiter/jobs
GET   /api/recruiter/jobs
GET   /api/recruiter/jobs/{jobId}/applications
GET   /api/recruiter/applications
PATCH /api/recruiter/applications/{applicationId}/status
```

Job create JSON fields: `title`, `company`, `location`, `jobType` (also accepts
`type`), `experience`, `salary`, `skills`, and `description`. Recruiter ID is
derived from the token.

The recruiter applicants response contains the application, job title/company,
candidate ID/name/email, location, skills, readiness, status, and timestamps.
Only the recruiter owning the job can access those applications. A job owned by
another recruiter returns `404`.

Status update JSON:

```json
{"status":"shortlisted","note":"Selected for the next round."}
```

Valid statuses are `under_review`, `shortlisted`, and `rejected`. A changed
status, its event-history row, and a candidate notification are committed in
the same transaction. The recruiter applicants page periodically refreshes so
new submissions appear without a manual reload.

## Labour-market intelligence and planning data

These SQLAlchemy models use the same SQLite database and the existing integer
`users.user_id` keys. Do not store candidate or recruiter profile IDs in a
separate identity namespace.

| Table | Purpose and important fields |
|---|---|
| `market_signals` | Evidence source, reference, role, sector, location, skill, requested proficiency, weighted demand value, contributor, and observation time. A recruiter job creates one `job_posting` signal per listed skill. |
| `employer_validations` | Employer's status (`endorsed`, `needs_revision`, `rejected`) and optional comments for a signal. One employer may validate a signal once. |
| `course_offerings` | Unique course code, qualification, sector, target role, curriculum skills and proficiency map, required equipment/trainer capabilities, placement rate, enrolment, status, and recommended update. |
| `training_capacity` | District/course seats, trainer count and capabilities, equipment available, and equipment/infrastructure readiness. A district/course pair is unique when a course is specified. |
| `placement_outcomes` | Optional candidate/course references, role, sector, district, placed flag, candidate/employer ratings, course relevance, feedback, and report time. |

`market_signals.demand_value` is a configurable weight for an evidence
observation, not a claim that the value equals vacancies, people, or market
share. Signal summaries aggregate this weight and report the separate signal
count. Recruiter job board rows in `jobs` remain separate from the legacy
`job_postings` market-intelligence feed.

The dashboard and demand API summarize evidence by role, skill, location, and
proficiency. Course analysis prefers signals matching the target role and
sector, then uses sector-wide evidence, then the overall evidence base when
more specific observations do not exist. It reports missing top-demand skills
and proficiency mismatches as review prompts. It may set a course to
`under_review`, but does not infer `obsolete` or `oversupplied` from weak raw
signals; a planner must assign those statuses based on validated evidence.
District planning compares demanded skills with district course coverage and
compares required equipment/trainer capabilities with reported availability.
An unreported resource is a data gap, not proof that the district lacks it.

### Intelligence and planning endpoints

All read endpoints below require a bearer token. Write endpoints enforce role
permissions in the API; do not rely on hiding frontend controls for security.

```http
GET   /api/intelligence/overview
GET   /api/intelligence/demand?location=...&sector=...&roleTitle=...
GET   /api/intelligence/signals?sourceType=...&location=...&roleTitle=...&skill=...
POST  /api/intelligence/signals
POST  /api/intelligence/signals/{signalId}/validation
GET   /api/intelligence/courses?sector=...&courseStatus=...
POST  /api/intelligence/courses
PATCH /api/intelligence/courses/{courseId}
GET   /api/intelligence/courses/{courseId}/analysis
GET   /api/intelligence/capacity?districtId=...
POST  /api/intelligence/capacity
PATCH /api/intelligence/capacity/{capacityId}
POST  /api/intelligence/placements
GET   /api/intelligence/district-plans/{districtId}
GET   /api/intelligence/candidate-guidance
```

Policy officers and institute administrators may manage evidence, courses,
capacity, and district plans. Recruiters may submit job/employer evidence,
validate market signals, and report placements. Candidates may submit their
own placement outcome and retrieve their own career guidance. Trainers may
submit permitted labour-market evidence. The exact role guards are enforced
server-side.

Use camelCase JSON and query parameter names in frontend/API integrations;
FastAPI maps them explicitly to the SQLAlchemy/Python snake_case fields. Signal
proficiency values are `beginner`, `intermediate`, `advanced`, `expert`, or
`unspecified`. Course status values are `active`, `under_review`, `obsolete`,
or `oversupplied`.

## Integrity and access rules

- Every protected recruiter/candidate endpoint checks role from the signed
  token.
- Candidates may apply only to active jobs and only as themselves.
- A unique database constraint is the final duplicate-application guard,
  including concurrent requests.
- Recruiters may list/change applications only for jobs they own.
- Candidates may list only their own applications and notifications.
- Job application count is computed from `job_applications`; it is not stored
  as an independently editable count.
- Deleting jobs/users with applications is restricted by foreign keys so
  history is not silently orphaned.
- Job/application/event/notification status values have database check
  constraints and request validation.
- Application plus initial history/recruiter notification are persisted
  together. Status plus event/candidate notification are persisted together.

## Local run and integration checks

1. Copy root `.env.example` to `.env`; choose a private `SECRET_KEY`.
3. Install backend requirements and run `py -m uvicorn app.main:app --reload`.
4. Run `npm install` and `npm run dev` in `frontend/`. Override
   `VITE_API_URL` only if the API uses a different URL.
5. Register a recruiter and candidate, create a job, apply, shortlist, and
   verify the candidate sees **Selected by recruiter**.
6. Verify a candidate cannot apply twice, another recruiter cannot inspect
   applications, and a closed/missing job cannot receive applications.

The current registration UI supports accounts for Candidate, Recruiter,
Trainer, Institute Admin, and Policy Officer. Mentor registration is accepted
by the backend API but is not offered by the frontend registration form.
