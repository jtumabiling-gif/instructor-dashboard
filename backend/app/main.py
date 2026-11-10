import hashlib
import hmac
import os
import secrets
from datetime import datetime
from typing import Literal, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import models
from .database import Base, SessionLocal, engine, get_db

Base.metadata.create_all(bind=engine)
app = FastAPI(title="WharfIntel Instructor Dashboard API")

secret_key = os.getenv("SESSION_SECRET") or secrets.token_urlsafe(32)
session_serializer = URLSafeTimedSerializer(secret_key, salt="instructor-dashboard-session-v1")
bearer_scheme = HTTPBearer(auto_error=False)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


class UserCredentials(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=8, max_length=128)


class ScenarioCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    weather: Literal["Nominal", "Deteriorating", "Cyclone Imminent"]
    fog_density: int = Field(ge=0, le=100)
    time_of_day: Literal["Day", "Night"]
    traffic_density: int = Field(ge=0, le=50)
    hazard_x: float
    hazard_z: float
    time_limit_minutes: int = Field(ge=1, le=60)
    minimum_hull_health: int = Field(ge=1, le=100)
    max_breakwater_speed: float = Field(ge=1, le=20)


class AssessmentCreate(BaseModel):
    scenario_name: str = Field(min_length=2, max_length=160)
    final_health: float = Field(ge=0, le=100)
    time_seconds: float = Field(ge=0)
    max_docking_speed: float = Field(ge=0, le=100)
    max_heel_angle: float = Field(ge=0, le=180)
    collisions: int = Field(ge=0)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt_hex, digest_hex = stored_hash.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), 310_000)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


@app.on_event("startup")
def create_bootstrap_instructor():
    username = os.getenv("BOOTSTRAP_INSTRUCTOR_USERNAME")
    password = os.getenv("BOOTSTRAP_INSTRUCTOR_PASSWORD")
    if not username or not password:
        return
    if len(password) < 12:
        raise RuntimeError("BOOTSTRAP_INSTRUCTOR_PASSWORD must be at least 12 characters.")
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.username == username).first()
        if existing:
            if existing.role not in ("instructor", "admin"):
                raise RuntimeError("Bootstrap username already belongs to a non-instructor account.")
            return
        db.add(models.User(username=username, password_hash=hash_password(password), role="instructor"))
        db.commit()
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/register", status_code=201)
def register_student(credentials: UserCredentials, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == credentials.username).first():
        raise HTTPException(status_code=409, detail="Username is already registered.")
    student = models.User(
        username=credentials.username,
        password_hash=hash_password(credentials.password),
        role="student",
    )
    db.add(student)
    db.commit()
    return {"message": "Student account created."}


@app.post("/login")
def login(credentials: UserCredentials, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = session_serializer.dumps({"user_id": user.id, "role": user.role})
    return {"user": user.username, "role": user.role, "access_token": token, "token_type": "bearer"}


def get_session_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required.")
    try:
        payload = session_serializer.loads(credentials.credentials, max_age=43_200)
    except SignatureExpired as error:
        raise HTTPException(status_code=401, detail="Session expired; please sign in again.") from error
    except BadSignature as error:
        raise HTTPException(status_code=401, detail="Invalid session.") from error
    user = db.query(models.User).filter(models.User.id == payload.get("user_id")).first()
    if not user or user.role != payload.get("role"):
        raise HTTPException(status_code=401, detail="Session is no longer valid.")
    return user


def require_instructor(user: models.User = Depends(get_session_user)):
    if user.role not in ("instructor", "admin"):
        raise HTTPException(status_code=403, detail="Instructor access required.")
    return user


@app.get("/api/instructor/dashboard")
def instructor_dashboard(
    db: Session = Depends(get_db),
    instructor: models.User = Depends(require_instructor),
):
    students = db.query(models.User).filter(models.User.role == "student").order_by(models.User.username).all()
    assessments = db.query(models.SimulationAssessment).order_by(models.SimulationAssessment.completed_at.desc()).all()
    scenarios = db.query(models.VesselScenario).order_by(models.VesselScenario.created_at.desc()).all()
    records_by_student = {}
    for record in assessments:
        records_by_student.setdefault(record.student_id, []).append(record)

    return {
        "students": [
            {
                "studentId": f"WI-{student.id:04d}",
                "name": student.username,
                "status": "Needs review" if records_by_student.get(student.id) and not records_by_student[student.id][0].passed else "On track",
                "lastScenario": records_by_student[student.id][0].scenario_name if records_by_student.get(student.id) else "No completed simulations",
                "averageScore": round(sum(item.score for item in records_by_student[student.id]) / len(records_by_student[student.id])) if records_by_student.get(student.id) else 0,
                "simulations": len(records_by_student.get(student.id, [])),
                "finalHealth": records_by_student[student.id][0].final_health if records_by_student.get(student.id) else None,
                "timeTaken": records_by_student[student.id][0].time_seconds if records_by_student.get(student.id) else None,
                "maxHeel": records_by_student[student.id][0].max_heel_angle if records_by_student.get(student.id) else None,
                "collisions": records_by_student[student.id][0].collisions if records_by_student.get(student.id) else None,
                "history": [
                    {
                        "scenario": record.scenario_name,
                        "score": record.score,
                        "result": "Passed" if record.passed else "Failed",
                        "date": record.completed_at.isoformat(),
                    }
                    for record in records_by_student.get(student.id, [])
                ],
            }
            for student in students
        ],
        "scenarios": [
            {
                "id": scenario.id,
                "name": scenario.name,
                "configuration": scenario.configuration,
                "status": scenario.status,
                "created_at": scenario.created_at.isoformat(),
            }
            for scenario in scenarios
        ],
        "assessments": [
            {
                "id": record.id,
                "student": record.student.username,
                "studentId": f"WI-{record.student_id:04d}",
                "scenario": record.scenario_name,
                "score": record.score,
                "result": "Passed" if record.passed else "Failed",
                "date": record.completed_at.isoformat(),
                "finalHealth": record.final_health,
                "timeSeconds": record.time_seconds,
                "maxHeel": record.max_heel_angle,
                "collisions": record.collisions,
            }
            for record in assessments
        ],
    }


@app.post("/api/instructor/scenarios", status_code=201)
def create_scenario(
    scenario: ScenarioCreate,
    db: Session = Depends(get_db),
    instructor: models.User = Depends(require_instructor),
):
    created = models.VesselScenario(
        name=scenario.name,
        configuration=scenario.model_dump(exclude={"name"}),
        created_by_id=instructor.id,
    )
    db.add(created)
    db.commit()
    db.refresh(created)
    return {
        "id": created.id,
        "name": created.name,
        "configuration": created.configuration,
        "status": created.status,
        "created_at": created.created_at.isoformat(),
    }


@app.post("/api/instructor/assessments", status_code=201)
def create_assessment(
    assessment: AssessmentCreate,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_session_user),
):
    if student.role != "student":
        raise HTTPException(status_code=403, detail="Only student accounts can submit simulation results.")
    scenario = db.query(models.VesselScenario).filter(
        models.VesselScenario.status == "DEPLOYED"
    ).order_by(models.VesselScenario.created_at.desc()).first()
    criteria = scenario.configuration if scenario else {}
    health_passed = assessment.final_health >= criteria.get("minimum_hull_health", 80)
    time_passed = assessment.time_seconds <= criteria.get("time_limit_minutes", float("inf")) * 60
    speed_passed = assessment.max_docking_speed <= criteria.get("max_breakwater_speed", float("inf"))
    collisions_passed = assessment.collisions == 0
    passed = health_passed and time_passed and speed_passed and collisions_passed
    score = max(0, min(100, round(
        assessment.final_health * 0.6
        + (20 if time_passed else 0)
        + (10 if speed_passed else 0)
        + (10 if collisions_passed else 0)
    )))
    record = models.SimulationAssessment(
        student_id=student.id,
        scenario_id=scenario.id if scenario else None,
        scenario_name=scenario.name if scenario else assessment.scenario_name,
        score=score,
        passed=passed,
        final_health=assessment.final_health,
        time_seconds=assessment.time_seconds,
        max_docking_speed=assessment.max_docking_speed,
        max_heel_angle=assessment.max_heel_angle,
        collisions=assessment.collisions,
        completed_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "score": score, "passed": passed}
