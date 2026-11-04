
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


# 1. USERS
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(
        String(150), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(40), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )


# 2. BATCHES
class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_code: Mapped[str] = mapped_column(
        String(80), unique=True, index=True, nullable=False
    )
    supplier: Mapped[str] = mapped_column(String(150), nullable=False)
    quantity_liters: Mapped[float] = mapped_column(Float, nullable=False)
    origin: Mapped[str] = mapped_column(String(200), nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    route: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="IN_TRANSIT")
    risk_level: Mapped[str] = mapped_column(String(30), default="LOW")
    expected_arrival_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


# 3. SENSOR READINGS
class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"), index=True, nullable=False
    )
    sensor_id: Mapped[str] = mapped_column(String(80), nullable=False)
    temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    reliability_status: Mapped[str] = mapped_column(
        String(40), default="PENDING"
    )
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


# 4. INCIDENTS
class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"), index=True, nullable=False
    )
    incident_type: Mapped[str] = mapped_column(String(80), nullable=False)
    severity: Mapped[str] = mapped_column(String(30), default="LOW")
    status: Mapped[str] = mapped_column(String(40), default="OPEN")
    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    duration_minutes: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)


# 5. QC RECORDS
class QCRecord(Base):
    __tablename__ = "qc_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"), index=True, nullable=False
    )
    inspector_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    sample_time: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    fat_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    snf_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    acidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    qc_status: Mapped[str] = mapped_column(String(40), default="PENDING")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


# 6. CUSTODY EVENTS
class CustodyEvent(Base):
    __tablename__ = "custody_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"), index=True, nullable=False
    )
    from_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    to_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    from_location: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    to_location: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    handover_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    batch_condition: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    status: Mapped[str] = mapped_column(String(40), default="PENDING")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


# 7. DECISION RECORDS
class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"), index=True, nullable=False
    )
    incident_id: Mapped[int | None] = mapped_column(
        ForeignKey("incidents.id"), nullable=True
    )
    recommended_action: Mapped[str] = mapped_column(
        String(40), nullable=False
    )
    final_action: Mapped[str | None] = mapped_column(
        String(40), nullable=True
    )
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_summary: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )
    approval_status: Mapped[str] = mapped_column(
        String(40), default="PENDING"
    )
    recommended_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    reason_for_override: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )


# 8. FACILITIES
class Facility(Base):
    __tablename__ = "facilities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    facility_type: Mapped[str] = mapped_column(String(80), nullable=False)
    processing_compatibility: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )
    total_capacity_liters: Mapped[float] = mapped_column(Float, nullable=False)
    available_capacity_liters: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    estimated_distance_km: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    estimated_travel_minutes: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)


# 9. DIVERSION RECORDS
class DiversionRecord(Base):
    __tablename__ = "diversion_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id"), index=True, nullable=False
    )
    source_facility_id: Mapped[int | None] = mapped_column(
        ForeignKey("facilities.id"), nullable=True
    )
    destination_facility_id: Mapped[int | None] = mapped_column(
        ForeignKey("facilities.id"), nullable=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(40), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )


# 10. ALERTS
class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    batch_id: Mapped[int | None] = mapped_column(
        ForeignKey("batches.id"), nullable=True
    )
    incident_id: Mapped[int | None] = mapped_column(
        ForeignKey("incidents.id"), nullable=True
    )
    alert_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(30), default="INFO")
    action_required: Mapped[bool] = mapped_column(Boolean, default=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )


# 11. AUDIT LOGS
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    batch_id: Mapped[int | None] = mapped_column(
        ForeignKey("batches.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(
        String(80), nullable=True
    )
    before_data: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )
    after_data: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

# 12. USER SESSIONS
class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )

    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )