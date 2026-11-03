from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..schemas import (
    DiversionCreate,
    DiversionReview,
    DiversionResponse
)

router = APIRouter(
    prefix="/diversions",
    tags=["Diversion Management"]
)


@router.post("/", response_model=DiversionResponse, status_code=201)
def create_diversion(
    diversion: DiversionCreate,
    db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(
        models.Batch.id == diversion.batch_id
    ).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if diversion.source_facility_id is not None:
        source = db.query(models.Facility).filter(
            models.Facility.id == diversion.source_facility_id
        ).first()

        if not source:
            raise HTTPException(
                status_code=404,
                detail="Source facility not found"
            )

    if diversion.destination_facility_id is not None:
        destination = db.query(models.Facility).filter(
            models.Facility.id == diversion.destination_facility_id
        ).first()

        if not destination:
            raise HTTPException(
                status_code=404,
                detail="Destination facility not found"
            )

        if not destination.is_available:
            raise HTTPException(
                status_code=400,
                detail="Destination facility is not available"
            )

        if destination.available_capacity_liters < batch.quantity_liters:
            raise HTTPException(
                status_code=400,
                detail="Destination facility has insufficient available capacity"
            )

    if (
        diversion.source_facility_id is not None
        and diversion.source_facility_id == diversion.destination_facility_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Source and destination facilities cannot be the same"
        )

    new_diversion = models.DiversionRecord(
        batch_id=diversion.batch_id,
        source_facility_id=diversion.source_facility_id,
        destination_facility_id=diversion.destination_facility_id,
        reason=diversion.reason,
        status="PENDING"
    )

    db.add(new_diversion)
    db.commit()
    db.refresh(new_diversion)

    return new_diversion


@router.get("/", response_model=list[DiversionResponse])
def get_diversions(db: Session = Depends(get_db)):
    return db.query(models.DiversionRecord).order_by(
        models.DiversionRecord.id.desc()
    ).all()


@router.get("/batch/{batch_id}", response_model=list[DiversionResponse])
def get_batch_diversions(
    batch_id: int,
    db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(
        models.Batch.id == batch_id
    ).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return db.query(models.DiversionRecord).filter(
        models.DiversionRecord.batch_id == batch_id
    ).order_by(models.DiversionRecord.id.desc()).all()


@router.get("/{diversion_id}", response_model=DiversionResponse)
def get_diversion(
    diversion_id: int,
    db: Session = Depends(get_db)
):
    diversion = db.query(models.DiversionRecord).filter(
        models.DiversionRecord.id == diversion_id
    ).first()

    if not diversion:
        raise HTTPException(status_code=404, detail="Diversion not found")

    return diversion


@router.patch("/{diversion_id}", response_model=DiversionResponse)
def review_diversion(
    diversion_id: int,
    review: DiversionReview,
    db: Session = Depends(get_db)
):
    diversion = db.query(models.DiversionRecord).filter(
        models.DiversionRecord.id == diversion_id
    ).first()

    if not diversion:
        raise HTTPException(status_code=404, detail="Diversion not found")

    allowed_statuses = {"APPROVED", "REJECTED", "CONFIRMED"}

    if review.status.upper() not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be APPROVED, REJECTED, or CONFIRMED"
        )

    if review.status.upper() in {"APPROVED", "CONFIRMED"}:
        if diversion.destination_facility_id is None:
            raise HTTPException(
                status_code=400,
                detail="A destination facility is required for approval"
            )

        destination = db.query(models.Facility).filter(
            models.Facility.id == diversion.destination_facility_id
        ).first()

        batch = db.query(models.Batch).filter(
            models.Batch.id == diversion.batch_id
        ).first()

        if not destination or not batch:
            raise HTTPException(
                status_code=404,
                detail="Destination facility or batch not found"
            )

        if not destination.is_available:
            raise HTTPException(
                status_code=400,
                detail="Destination facility is not available"
            )

        if destination.available_capacity_liters < batch.quantity_liters:
            raise HTTPException(
                status_code=400,
                detail="Destination facility has insufficient available capacity"
            )

    if review.approved_by is not None:
        approver = db.query(models.User).filter(
            models.User.id == review.approved_by
        ).first()

        if not approver:
            raise HTTPException(status_code=404, detail="Approver not found")

    diversion.status = review.status.upper()
    diversion.approved_by = review.approved_by

    if diversion.status == "CONFIRMED":
        diversion.confirmed_at = datetime.utcnow()
    else:
        diversion.confirmed_at = None

    db.commit()
    db.refresh(diversion)

    return diversion