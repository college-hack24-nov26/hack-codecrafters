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
