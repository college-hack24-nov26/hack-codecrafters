
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import SensorReadingCreate, SensorReadingResponse
from .auth import require_roles


router = APIRouter(
    prefix="/sensor-readings",
    tags=["Sensor Readings - DETECT"]
)


# 1. Save a sensor reading - Admin, Transport
@router.post(
    "/",
    response_model=SensorReadingResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_roles("Admin", "Transport"))
    ]
)
def create_sensor_reading(
    reading_data: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(
        models.Batch.id == reading_data.batch_id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    new_reading = models.SensorReading(
        **reading_data.model_dump(exclude_none=True)
    )

    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    return new_reading


# 2. Get sensor readings for a batch - All authorized roles
@router.get(
    "/batch/{batch_id}",
    response_model=list[SensorReadingResponse],
    dependencies=[
        Depends(require_roles("Admin", "Transport", "Receiving", "QC"))
    ]
)
def get_batch_sensor_readings(
    batch_id: int,
    db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(
        models.Batch.id == batch_id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    readings = (
        db.query(models.SensorReading)
        .filter(models.SensorReading.batch_id == batch_id)
        .order_by(models.SensorReading.recorded_at.desc())
        .all()
    )

    return readings
