# Job Posting and Application Database Handoff

## Purpose

Build the persistent backend for this workflow:

1. A recruiter publishes an active job.
2. Candidates can discover and view that job.
3. A candidate applies once to that job.
4. The recruiter sees the application and candidate details.
5. The recruiter changes the application status.
6. The candidate can see the updated status and is notified when selected.

The current frontend is a demo that stores jobs and applications in browser
`localStorage`. That data is limited to one browser and does not synchronize
between a recruiter's and candidate's devices. The database and API described
here should replace that demo storage for shared, persistent use.

## Assumptions and terminology

- Database: MySQL 8.0.16 or newer with InnoDB tables. This version supports
  enforced `CHECK` constraints.
- `users` is the common account table. A user's role is `candidate` or
  `recruiter` for these workflows.
- A job belongs to one recruiter account.
- An application belongs to exactly one candidate and one job. Its recruiter
  is determined by the job owner.
- Application statuses used by the current UI:
  - `under_review`
  - `shortlisted` (display as “Selected by recruiter” to the candidate)
  - `rejected`
- Job statuses used by the current UI:
  - `active`
  - `closed`
- Do not store applicant totals as a manually maintained source of truth.
  Calculate them from applications to avoid count drift.
- The existing login is a role-preview demo. Production APIs must obtain the
  authenticated user identity from the server-validated session/token, not
  trust a `candidateId` or `recruiterId` supplied in the request body.

## Entity relationship

```text
users (candidate) 1 ────── * applications * ────── 1 jobs
users (recruiter) 1 ────── * jobs
applications 1 ────── * application_events
users (recipient) 1 ────── * notifications
```

## MySQL schema proposal

This is an implementation starting point. Use migrations in the backend
project rather than running ad-hoc SQL in production. Generate UUIDs in the
backend and store them as `CHAR(36)`; this keeps API IDs straightforward and
avoids tying UUID creation to one MySQL version. Use UTC for database
connections and application timestamps.

```sql
CREATE TABLE users (
    id              CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    email           VARCHAR(254) NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(32) NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT users_role_check CHECK (role IN ('candidate', 'recruiter'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE candidate_profiles (
    user_id         CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    location        VARCHAR(255),
    phone           VARCHAR(50),
    skills          JSON NOT NULL,
    experience      TEXT,
    education       TEXT,
    summary         TEXT,
    resume_url      TEXT,
    readiness       SMALLINT,
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT candidate_profiles_readiness_check
        CHECK (readiness IS NULL OR readiness BETWEEN 0 AND 100),
    CONSTRAINT candidate_profiles_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE recruiter_profiles (
    user_id         CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    company_name    VARCHAR(255) NOT NULL,
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT recruiter_profiles_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE jobs (
    id              CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    recruiter_id    CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    title           VARCHAR(255) NOT NULL,
    company         VARCHAR(255) NOT NULL,
    location        VARCHAR(255) NOT NULL,
    job_type        VARCHAR(32) NOT NULL,
    experience      VARCHAR(255) NOT NULL,
    salary          VARCHAR(255) NOT NULL,
    skills          JSON NOT NULL,
    description     TEXT NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'active',
    published_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX jobs_active_published_idx (status, published_at DESC),
    INDEX jobs_recruiter_idx (recruiter_id, created_at DESC),
    CONSTRAINT jobs_type_check
        CHECK (job_type IN ('Full Time', 'Part Time', 'Internship', 'Contract')),
    CONSTRAINT jobs_status_check CHECK (status IN ('active', 'closed')),
    CONSTRAINT jobs_recruiter_fk
        FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE applications (
    id              CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    job_id          CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    candidate_id    CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    status          VARCHAR(24) NOT NULL DEFAULT 'under_review',
    cover_note      TEXT,
    applied_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY applications_one_per_candidate_job (job_id, candidate_id),
    INDEX applications_candidate_idx (candidate_id, applied_at DESC),
    CONSTRAINT applications_status_check
        CHECK (status IN ('under_review', 'shortlisted', 'rejected')),
    CONSTRAINT applications_job_fk
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
    CONSTRAINT applications_candidate_fk
        FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE application_events (
    id              CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    application_id  CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    actor_user_id   CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    old_status      VARCHAR(24) NULL,
    new_status      VARCHAR(24) NOT NULL,
    note            TEXT,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX application_events_application_idx (application_id, created_at DESC),
    CONSTRAINT application_events_old_status_check
        CHECK (old_status IS NULL OR
               old_status IN ('under_review', 'shortlisted', 'rejected')),
    CONSTRAINT application_events_new_status_check
        CHECK (new_status IN ('under_review', 'shortlisted', 'rejected')),
    CONSTRAINT application_events_application_fk
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT application_events_actor_fk
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notifications (
    id              CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    recipient_id    CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    application_id  CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    type            VARCHAR(40) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    is_read         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    read_at         DATETIME(3) NULL,
    INDEX notifications_recipient_unread_idx
        (recipient_id, is_read, created_at DESC),
    CONSTRAINT notifications_type_check
        CHECK (type IN ('new_application', 'application_status_changed')),
    CONSTRAINT notifications_recipient_fk
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_application_fk
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

The `skills` columns are MySQL `JSON` arrays; the backend should write a JSON
array such as `["React", "Node.js"]` and validate that each value is a string.
Supply an empty array (`[]`) when no skills are present rather than relying on
a database default. Create UUID values in the backend for all primary and
foreign keys before inserting related rows. `CHECK` constraints are enforced
starting with MySQL 8.0.16; use this minimum version or add equivalent
application validation if an older server is unavoidable.

### Important data rules

- The authenticated user's role must be checked for every protected endpoint.
- A candidate may apply only to an active job.
- The unique `(job_id, candidate_id)` constraint is the final defense against
  duplicate applications, including simultaneous requests.
- On application creation, save the application, its initial event, and any
  recruiter notification in one transaction.
- On status change, save the new status, status event, and candidate
  notification in one transaction.
- Only the recruiter who owns a job may view or update its applications.
- Only the candidate who owns an application may read it.
- Only the owning recruiter may change application status.
- Do not let a status update change the job or candidate associated with an
  application.
- Treat resume files as private objects in file/blob storage; store only an
  access-controlled URL/key in the profile.

## API contract

Use JSON over HTTPS. Resource IDs below are UUIDs. Authentication is assumed to
be a server-validated bearer token or secure session cookie. All list endpoints
should be paginated in production.

### Candidate-facing endpoints

#### List active jobs

```http
GET /api/jobs?search=developer&location=Bangalore&type=Full%20Time&page=1
```

Return active jobs only by default. `search`, `location`, and `type` are
optional filters.

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Full Stack Developer",
      "company": "TechNova Solutions",
      "location": "Bangalore",
      "type": "Full Time",
      "experience": "0–2 Years",
      "salary": "₹6–10 LPA",
      "skills": ["React", "Node.js", "PostgreSQL"],
      "description": "Build and maintain web applications.",
      "postedAt": "2026-09-25T10:00:00Z",
      "applicantCount": 4
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

#### View one active job

```http
GET /api/jobs/{jobId}
```

Return `404` for a missing job. Do not expose private recruiter or applicant
data in a public job response.

#### Apply to a job

```http
POST /api/jobs/{jobId}/applications
Content-Type: application/json
```

The candidate ID comes from the authenticated user, not the request body.

```json
{
  "coverNote": "I am interested in this role."
}
```

Return `201 Created` with the created application. Return `409 Conflict` if the
candidate already applied, or if the job is no longer active.

```json
{
  "id": "application-uuid",
  "jobId": "job-uuid",
  "candidateId": "candidate-uuid",
  "status": "under_review",
  "appliedAt": "2026-09-25T10:10:00Z"
}
```

#### View my applications and status

```http
GET /api/me/applications?page=1
```

```json
{
  "items": [
    {
      "id": "application-uuid",
      "job": {
        "id": "job-uuid",
        "title": "Full Stack Developer",
        "company": "TechNova Solutions"
      },
      "status": "shortlisted",
      "statusLabel": "Selected by recruiter",
      "appliedAt": "2026-09-25T10:10:00Z",
      "updatedAt": "2026-09-26T09:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

The frontend must refresh this resource when the candidate returns to the page.
For prompt notification while already online, use polling, server-sent events,
or WebSockets; database persistence alone does not push updates into an open
browser.

### Recruiter-facing endpoints

#### Create a job

```http
POST /api/recruiter/jobs
Content-Type: application/json
```

The recruiter ID comes from the authenticated user.

```json
{
  "title": "Full Stack Developer",
  "company": "TechNova Solutions",
  "location": "Bangalore",
  "type": "Full Time",
  "experience": "0–2 Years",
  "salary": "₹6–10 LPA",
  "skills": ["React", "Node.js", "PostgreSQL"],
  "description": "Build and maintain web applications."
}
```

Return `201 Created` with the persisted job. The new active job should be
visible from `GET /api/jobs` without additional manual publication steps.

#### List my jobs

```http
GET /api/recruiter/jobs?page=1
```

Return only jobs owned by the authenticated recruiter. Include
`applicantCount`, calculated from `applications`.

#### List applications for a recruiter-owned job

```http
GET /api/recruiter/jobs/{jobId}/applications?status=under_review&page=1
```

Return `404` or `403` if the job does not belong to the authenticated
recruiter. Candidate contact/profile data is returned only to the owning
recruiter.

```json
{
  "items": [
    {
      "id": "application-uuid",
      "jobId": "job-uuid",
      "candidate": {
        "id": "candidate-uuid",
        "fullName": "Aarav Sharma",
        "email": "candidate@kaushal.demo",
        "location": "Bangalore",
        "skills": ["React", "JavaScript", "Node.js"],
        "phone": null,
        "experience": null,
        "education": null,
        "summary": null,
        "resumeUrl": null,
        "readiness": 78
      },
      "status": "under_review",
      "appliedAt": "2026-09-25T10:10:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

#### Change application status

```http
PATCH /api/recruiter/applications/{applicationId}/status
Content-Type: application/json
```

```json
{
  "status": "shortlisted",
  "note": "Selected for the next round."
}
```

Persist the status, add an `application_events` row, and create an
`application_status_changed` notification for that application's candidate in
one transaction. Return the updated application. The candidate's next read of
`GET /api/me/applications` must return the new status.

Valid status transitions for the current UI:

```text
under_review -> shortlisted
under_review -> rejected
shortlisted  -> rejected
rejected     -> shortlisted (allow only if recruiter is intentionally
                              reconsidering; alternatively disallow by policy)
```

If the team chooses to disallow reconsideration, enforce it server-side and
return `409 Conflict` for the invalid transition.

### Notifications endpoints (recommended)

```http
GET   /api/me/notifications?unreadOnly=true&page=1
PATCH /api/me/notifications/{notificationId}/read
```

The candidate notification on shortlist should have a clear message, for
example: “You were selected for Full Stack Developer at TechNova Solutions.”
The existing candidate application list is still the durable source of status;
the notification is the prompt telling them to check it.

## Transaction outlines

### Applying to a job

1. Resolve candidate from authenticated session and confirm role is candidate.
2. Begin an InnoDB transaction.
3. Select the job with `SELECT ... FOR UPDATE` and verify it is active. This
   serializes applying against a concurrent job-close operation.
4. Insert application with initial `under_review` status.
5. Insert initial `application_events` row (`old_status = NULL`).
6. Optionally insert a `new_application` notification for the job's recruiter.
7. Commit and return the application.
8. Translate unique-constraint violation to HTTP `409`.

Applicant count is `COUNT(*)` over applications for the job. If caching the
count later for performance, update it transactionally and periodically
reconcile it against the applications table.

### Shortlisting/rejecting

1. Resolve recruiter from authenticated session and confirm role is recruiter.
2. Begin an InnoDB transaction.
3. Lock/read the application with `SELECT ... FOR UPDATE` and join its job;
   verify job owner is this recruiter.
4. Validate requested status and transition.
5. Update application status and `updated_at`.
6. Insert status-change event with actor, prior status, new status, and note.
7. Insert `application_status_changed` notification for the candidate.
8. Commit and return the updated application.

## UI-to-backend field mapping

| Existing UI concept | Database/API field |
|---|---|
| `job.id` | `jobs.id` |
| `job.recruiterId` | `jobs.recruiter_id` (derived from auth when creating) |
| `job.title`, `company`, `location` | matching `jobs` columns |
| `job.type` | `jobs.job_type` |
| `job.skills` | `jobs.skills` |
| `job.status === "Active"` | `jobs.status = 'active'` |
| `application.id` | `applications.id` |
| `application.jobId` | `applications.job_id` |
| `application.candidateId` | `applications.candidate_id` (derived from auth) |
| `application.recruiterId` | derive through `applications.job_id -> jobs.recruiter_id` |
| `Under Review` | `under_review` |
| `Shortlisted` | `shortlisted`, candidate-facing label “Selected by recruiter” |
| `Rejected` | `rejected` |
| Candidate skills/contact/CV | `candidate_profiles` joined with `users` |

Keep API status casing consistent (recommended lowercase machine values);
translate machine values to UI labels in the frontend.

## Error behavior

Use predictable JSON errors, for example:

```json
{
  "error": {
    "code": "already_applied",
    "message": "You have already applied for this job."
  }
}
```

Recommended HTTP status codes:

- `400 Bad Request`: malformed body or invalid field values.
- `401 Unauthorized`: missing or invalid authentication.
- `403 Forbidden`: authenticated user has the wrong role or does not own the
  requested resource (using `404` instead is also acceptable to avoid
  disclosing resource existence; apply consistently).
- `404 Not Found`: job/application does not exist.
- `409 Conflict`: duplicate application, closed job, or invalid status
  transition.
- `500 Internal Server Error`: unexpected server/database failure; log details
  server-side, but do not return secrets or SQL error text to the client.

## Acceptance checks

1. A recruiter creates a job; it survives reload and appears in the candidate
   job list for a separate account/browser.
2. A closed job is not returned by the default candidate job list and cannot
   receive a new application.
3. A candidate applies; the application appears under the correct recruiter
   and only that recruiter.
4. Submitting the same application twice creates one row and returns a
   duplicate/conflict response.
5. The recruiter can see candidate name, email, skills, and profile fields
   associated with the application.
6. A recruiter cannot read or change applications for another recruiter's
   job.
7. A candidate cannot read another candidate's applications or submit as a
   different candidate by changing a request field.
8. Recruiter shortlisting changes the stored application status and creates a
   candidate notification atomically.
9. The candidate sees “Selected by recruiter” after reloading/refetching their
   application list.
10. Rejecting an applicant is also reflected on the candidate's application
    list.
11. Recruiter applicant totals equal the number of applications, including
    concurrent submissions.
12. Deleting/deactivating a user or job follows the FK/retention policy and
    does not silently orphan application history.

## Integration notes

- The frontend currently has local-demo functions in `src/services/api.js`.
  Replace or wrap these with HTTP calls when the backend is ready; do not use
  `localStorage` as the cross-user database.
- Keep IDs consistent across login, job creation, applications, and status
  updates. The current demo uses role-specific user IDs; production IDs must
  come from persisted accounts.
- Keep application status labels and API machine values mapped in one place.
- Do not store passwords in these profile tables. Authentication/password
  handling belongs to the identity/authentication implementation.
- Consider adding rate limits and audit logging for application submission and
  recruiter status changes.
