# KAUSHAL Frontend

React + Vite frontend starter for the KAUSHAL labour-market intelligence and curriculum-alignment platform.

## Roles

- Candidate
- Recruiter
- Trainer
- Institute Admin
- Policy Officer

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Demo RBAC

The login screen contains a role selector so the frontend can demonstrate different role-based dashboards before the FastAPI backend is connected.

## Backend

Set the FastAPI base URL in `.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Frontend RBAC controls navigation and page access. Production authorization must also be enforced by the backend.

## Naming

React-side state, props and API fields use camelCase, matching the project naming reference.