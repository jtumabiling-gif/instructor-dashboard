from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False, default="student")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    assessments = relationship("SimulationAssessment", back_populates="student")


class VesselScenario(Base):
    __tablename__ = "vessel_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    configuration = Column(JSON, nullable=False)
    status = Column(String(20), nullable=False, default="DEPLOYED")
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    creator = relationship("User")
    assessments = relationship("SimulationAssessment", back_populates="scenario")


class SimulationAssessment(Base):
    __tablename__ = "simulation_assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scenario_id = Column(Integer, ForeignKey("vessel_scenarios.id"), nullable=True, index=True)
    scenario_name = Column(String(160), nullable=False)
    score = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False)
    final_health = Column(Float, nullable=False)
    time_seconds = Column(Float, nullable=False)
    max_docking_speed = Column(Float, nullable=False, default=0)
    max_heel_angle = Column(Float, nullable=False)
    collisions = Column(Integer, nullable=False)
    completed_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    student = relationship("User", back_populates="assessments")
    scenario = relationship("VesselScenario", back_populates="assessments")
