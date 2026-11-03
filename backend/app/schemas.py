from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BatchCreate(BaseModel):
    batch_code: str = Field(min_length=2, max_length=80)
    supplier: str = Field(min_length=2, max_length=150)
    quantity_liters: float = Field(gt=0)
    origin: str = Field(min_length=2, max_length=200)
    destination: str = Field(min_length=2, max_length=200)
    route: str | None = None
    expected_arrival_at: datetime | None = None


class BatchUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=40)
    risk_level: str | None = Field(default=None, max_length=30)
    route: str | None = None
    expected_arrival_at: datetime | None = None


class BatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_code: str
    supplier: str
    quantity_liters: float
    origin: str
    destination: str
    route: str | None
    status: str
    risk_level: str
    expected_arrival_at: datetime | None
    created_at: datetime
    updated_at: datetime
# SENSOR READING SCHEMAS

class SensorReadingCreate(BaseModel):
    batch_id: int = Field(gt=0)
    sensor_id: str = Field(min_length=1, max_length=80)
    temperature_c: float
    recorded_at: datetime | None = None
    is_simulated: bool = True
    notes: str | None = None


class SensorReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: int
    sensor_id: str
    temperature_c: float
    recorded_at: datetime
    is_simulated: bool
    reliability_status: str
    anomaly_flag: bool
    notes: str | None

# INCIDENT SCHEMAS

class IncidentCreate(BaseModel):
    batch_id: int = Field(gt=0)
    incident_type: str = Field(min_length=2, max_length=80)
    severity: str = Field(default="LOW", max_length=30)
    summary: str | None = None
    started_at: datetime | None = None


class IncidentUpdate(BaseModel):
    severity: str | None = Field(default=None, max_length=30)
    status: str | None = Field(default=None, max_length=40)
    ended_at: datetime | None = None
    duration_minutes: float | None = Field(default=None, ge=0)
    summary: str | None = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: int
    incident_type: str
    severity: str
    status: str
    started_at: datetime
    ended_at: datetime | None
    duration_minutes: float | None
    summary: str | None

# QC RECORD SCHEMAS

class QCCreate(BaseModel):
    batch_id: int = Field(gt=0)
    inspector_id: int | None = Field(default=None, gt=0)
    sample_time: datetime | None = None
    fat_percent: float | None = Field(default=None, ge=0, le=100)
    snf_percent: float | None = Field(default=None, ge=0, le=100)
    acidity: float | None = Field(default=None, ge=0)
    notes: str | None = None


class QCUpdate(BaseModel):
    fat_percent: float | None = Field(default=None, ge=0, le=100)
    snf_percent: float | None = Field(default=None, ge=0, le=100)
    acidity: float | None = Field(default=None, ge=0)
    qc_status: str | None = Field(default=None, max_length=40)
    notes: str | None = None


class QCResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    batch_id: int
    inspector_id: int | None
    sample_time: datetime
    fat_percent: float | None
    snf_percent: float | None
    acidity: float | None
    qc_status: str
    notes: str | None
# ==============================
# DECISION SUPPORT SCHEMAS
# ==============================

class DecisionCreate(BaseModel):
    batch_id: int
    incident_id: int | None = None
    recommended_action: str = Field(min_length=2, max_length=40)
    explanation: str = Field(min_length=5)
    evidence_summary: dict | None = None


class DecisionReview(BaseModel):
    final_action: str | None = Field(default=None, max_length=40)
    approval_status: str = Field(min_length=2, max_length=40)
    reviewed_by: int | None = None
    approved_by: int | None = None
    reason_for_override: str | None = None


class DecisionResponse(BaseModel):
    id: int
    batch_id: int
    incident_id: int | None
    recommended_action: str
    final_action: str | None
    explanation: str
    evidence_summary: dict | None
    approval_status: str
    recommended_at: datetime
    reviewed_by: int | None
    approved_by: int | None
    approved_at: datetime | None
    reason_for_override: str | None

    model_config = ConfigDict(from_attributes=True)# ==============================
# FACILITY MANAGEMENT SCHEMAS
# ==============================

class FacilityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    facility_type: str = Field(min_length=2, max_length=80)
    processing_compatibility: list | None = None
    total_capacity_liters: float = Field(gt=0)
    available_capacity_liters: float = Field(ge=0)
    estimated_distance_km: float | None = Field(default=None, ge=0)
    estimated_travel_minutes: int | None = Field(default=None, ge=0)
    is_available: bool = True


class FacilityResponse(BaseModel):
    id: int
    name: str
    facility_type: str
    processing_compatibility: list | None
    total_capacity_liters: float
    available_capacity_liters: float
    estimated_distance_km: float | None
    estimated_travel_minutes: int | None
    is_available: bool

    model_config = ConfigDict(from_attributes=True)


# ==============================
# DIVERSION MANAGEMENT SCHEMAS
# ==============================

class DiversionCreate(BaseModel):
    batch_id: int
    source_facility_id: int | None = None
    destination_facility_id: int | None = None
    reason: str = Field(min_length=5)


class DiversionReview(BaseModel):
    status: str = Field(min_length=2, max_length=40)
    approved_by: int | None = None


class DiversionResponse(BaseModel):
    id: int
    batch_id: int
    source_facility_id: int | None
    destination_facility_id: int | None
    reason: str
    approved_by: int | None
    status: str
    created_at: datetime
    confirmed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

    model_config = ConfigDict(from_attributes=True)


# ==============================
# FACILITY MANAGEMENT SCHEMAS
# ==============================

