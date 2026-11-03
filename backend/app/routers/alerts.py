from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from pydantic import BaseModel, Field

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class AlertCreate(BaseModel):
    batch_id: int | None = None
    incident_id: int | None = None
    alert_type: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=150)
    message: str = Field(min_length=5)
    severity: str = "INFO"
    action_required: bool = False


class AlertResponse(BaseModel):
    id: int
    batch_id: int | None
    incident_id: int | None
    alert_type: str
    title: str
    message: str
    severity: str
    action_required: bool
    is_read: bool
    created_at: object

    model_config = {"from_attributes": True}


@router.post("/", response_model=AlertResponse, status_code=201)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    if alert.batch_id is not None:
        if not db.query(models.Batch).filter(
            models.Batch.id == alert.batch_id
        ).first():
            raise HTTPException(404, "Batch not found")

    if alert.incident_id is not None:
        incident = db.query(models.Incident).filter(
            models.Incident.id == alert.incident_id
        ).first()
        if not incident:
            raise HTTPException(404, "Incident not found")
        if alert.batch_id is not None and incident.batch_id != alert.batch_id:
            raise HTTPException(400, "Incident does not belong to this batch")

    new_alert = models.Alert(**alert.model_dump())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@router.get("/", response_model=list[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(
        models.Alert.id.desc()
    ).all()


@router.patch("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(
        models.Alert.id == alert_id
    ).first()

    if not alert:
        raise HTTPException(404, "Alert not found")

    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert