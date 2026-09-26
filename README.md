# KAUSHAL Platform

FastAPI backend and React/Vite frontend for the KAUSHAL platform.

The platform combines live recruiter vacancies and candidate applications with
labour-market evidence, employer validation, curriculum review, training
capacity, placement outcomes, district planning, and candidate career guidance.
Recruiter job-board records are intentionally separate from aggregated
`job_postings` intelligence records.

## Backend setup

1. Copy `.env.example` to `.env`. The default database is the local SQLite file
   `kaushal.db` (created locally and ignored by Git). Set a strong, private
   `SECRET_KEY` before deployment.
2. Install the Python dependencies and start the API:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   py -m pip install -r requirements.txt
   py -m uvicorn app.main:app --reload
   ```

The API is available at `http://localhost:8000`; OpenAPI docs are at
`http://localhost:8000/api/docs`.

SQLite is the agreed database for the complete project. `kaushal.db` is a
local data store and is not included in the public repository. SQLite
foreign-key enforcement is enabled for application connections. The startup
`create_all` call creates
new tables but does not modify existing columns or repair data. Startup also
applies a non-destructive additive migration for the training-capability field
on an already-created `training_capacity` table. Back up the database before
any schema migration or data repair.

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000/api`. Set
`VITE_API_URL` in `frontend/.env` when the API runs elsewhere.

## Job and application workflow

- Candidates browse active jobs and submit one application per job.
- Recruiters see applicants for jobs they own and may shortlist or reject them.
- A status change is persisted, recorded in application history, and creates a
  candidate notification. The candidate application list shows the latest
  status.
- User identity and ownership are derived from the authenticated bearer token.
- `JobPosting` under `/api/intelligence/jobs` remains the separate labour-market
  intelligence feed; recruiter vacancies are stored in `jobs`.

## Labour-market intelligence and planning

The evidence layer stores one `market_signals` row per role/skill/source/
location/proficiency observation. Recruiter-created jobs automatically add a
`job_posting` signal for each listed skill. Manual signal sources include job
postings, employer surveys, industry consultations, sector growth, placement
outcomes, and emerging technology. `demand_value` is a configurable evidence
weight, not a raw vacancy or headcount.

The platform also stores:

- `course_offerings`: qualification, target role, curriculum skills and
  proficiency, required equipment and trainer capabilities, course status,
  placement evidence, and review recommendations.
- `training_capacity`: district/course seats, trainer count and capabilities,
  equipment, and equipment/infrastructure readiness.
- `employer_validations`: employer endorsements, revision requests, or
  rejections of evidence signals.
- `placement_outcomes`: placed/not-placed outcomes, ratings, course relevance,
  and feedback used in aggregate placement indicators.

`GET /api/intelligence/overview` summarizes source, skill, role, location,
proficiency, curriculum, capacity, and placement measures.
`GET /api/intelligence/demand` provides grouped demand and accepts optional
`location`, `sector`, and `roleTitle` filters.
`GET /api/intelligence/candidate-guidance` matches a candidate's registered
skills and location to observed demand and active courses.

Course analysis compares a course's target role and sector to market signals,
falls back to sector-wide and then overall signals when role-specific evidence
is unavailable, and reports missing high-demand skills and proficiency gaps.
It can mark a course `under_review`; it does not automatically label a course
obsolete or oversupplied because those classifications require validated
placement and supply evidence. Planners record those statuses explicitly.
District plans compare recorded demand with courses offered in the district
and flag equipment/trainer capabilities not reported as available. These are
planning prompts based on reported data, not proof that a resource is absent.

See [`frontend/DATABASE_HANDOFF.md`](./frontend/DATABASE_HANDOFF.md) for the
table contract, authorization rules, payload examples, and endpoint details.
