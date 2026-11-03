from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from .. import models

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


class AuditLogCreate(BaseModel):
    user_id: int | None = None
    batch_id: int | None = None
    action: str
    entity_type: str
    entity_id: int
    before_data: dict | None = None
    after_data: dict | None = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    batch_id: int | None
    action: str
    entity_type: str
    entity_id: int
    before_data: dict | None
    after_data: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/", response_model=AuditLogResponse, status_code=201)
def create_audit_log(
    log: AuditLogCreate,
    db: Session = Depends(get_db)
):
    if log.user_id is not None:
        user = db.query(models.User).filter(
            models.User.id == log.user_id
        ).first()
        if not user:
            raise HTTPException(404, "User not found")

    if log.batch_id is not None:
        batch = db.query(models.Batch).filter(
            models.Batch.id == log.batch_id
        ).first()
        if not batch:
            raise HTTPException(404, "Batch not found")

    new_log = models.AuditLog(**log.model_dump())
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(
        models.AuditLog.id.desc()
    ).all()


@router.get("/batch/{batch_id}", response_model=list[AuditLogResponse])
def get_batch_audit_logs(
    batch_id: int,
    db: Session = Depends(get_db)
):
    return db.query(models.AuditLog).filter(
        models.AuditLog.batch_id == batch_id
    ).order_by(models.AuditLog.id.desc()).all()