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