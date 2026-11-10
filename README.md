# WharfIntel Instructor Dashboard

A focused React dashboard and FastAPI service for vessel-simulation instructors. It replaces the former LMS-oriented instructor view with a command overview, student roster, scenario builder, and assessment records. Dashboard metrics, roster entries, scenarios, and results come from the API and database rather than embedded demo records.

## Features

- Dark/light instructor workspace with overview metrics and recent assessment activity.
- Student roster and individual telemetry/history review.
- Persistent scenario configuration for weather, fog, day/night, traffic, hazards, and assessment limits.
- Student assessment storage and pass/fail evaluation using the latest deployed scenario criteria.
- Signed, expiring bearer sessions; instructor-only dashboard and scenario creation endpoints.
- Student self-registration, with instructor accounts provisioned from server environment variables.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.10+

## Start the API

In PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:DATABASE_URL = "sqlite:///./instructor-dashboard.db"
$env:SESSION_SECRET = (py -c "import secrets; print(secrets.token_urlsafe(48))")
$env:BOOTSTRAP_INSTRUCTOR_USERNAME = "instructor"
$env:BOOTSTRAP_INSTRUCTOR_PASSWORD = "choose-a-unique-password-of-12-or-more"
$env:CORS_ORIGINS = "http://127.0.0.1:5173,http://localhost:5173"
py -m uvicorn app.main:app --reload --port 8000
```

Set a unique instructor password and keep `SESSION_SECRET` private. The bootstrap instructor is created when the API starts if that username does not already exist. SQLite is the default storage; set `DATABASE_URL` to a supported SQLAlchemy database URL to use another database.

## Start the frontend

In a second PowerShell window:

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
npm run dev
```

Open `http://127.0.0.1:5173`. Sign in with the bootstrap instructor. Students can create accounts from the login screen; their accounts appear in the roster after creation.

## Simulation assessment integration

The API accepts completed student simulation telemetry at `POST /api/instructor/assessments` using a student bearer token. The request body is:

```json
{
  "scenario_name": "Harbor Berthing",
  "final_health": 94,
  "time_seconds": 180,
  "max_docking_speed": 2.4,
  "max_heel_angle": 7.2,
  "collisions": 0
}
```

Assessment results are saved and evaluated against the most recently deployed scenario's time, hull-health, and breakwater-speed criteria; any collision fails the run. The dashboard-only repository does not include the WharfIntel vessel-simulation scene, so connect its completion callback to this endpoint to submit real runs. Scenario weather, fog, traffic, and hazard settings are persisted for that integration but are not applied by this dashboard service to a simulation scene.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | API health check |
| `POST` | `/register` | Create a student account |
| `POST` | `/login` | Authenticate and issue a signed session |
| `GET` | `/api/instructor/dashboard` | Read roster, scenarios, and assessment records |
| `POST` | `/api/instructor/scenarios` | Save and deploy a scenario (instructor/admin) |
| `POST` | `/api/instructor/assessments` | Submit a student's simulation telemetry |
