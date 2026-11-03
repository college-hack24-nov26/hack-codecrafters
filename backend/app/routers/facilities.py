from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..schemas import FacilityCreate, FacilityResponse

router = APIRouter(
    prefix="/facilities",
    tags=["Facility Management"]
)


@router.post("/", response_model=FacilityResponse, status_code=201)
def create_facility(
    facility: FacilityCreate,
    db: Session = Depends(get_db)
):
    if facility.available_capacity_liters > facility.total_capacity_liters:
        raise HTTPException(
            status_code=400,
            detail="Available capacity cannot exceed total capacity"
        )

    new_facility = models.Facility(**facility.model_dump())

    db.add(new_facility)
    db.commit()
    db.refresh(new_facility)

    return new_facility


@router.get("/", response_model=list[FacilityResponse])
def get_facilities(db: Session = Depends(get_db)):
    return db.query(models.Facility).order_by(
        models.Facility.id.desc()
    ).all()


@router.get("/available", response_model=list[FacilityResponse])
def get_available_facilities(db: Session = Depends(get_db)):
    return db.query(models.Facility).filter(
        models.Facility.is_available == True,
        models.Facility.available_capacity_liters > 0
    ).all()


@router.get("/{facility_id}", response_model=FacilityResponse)
def get_facility(
    facility_id: int,
    db: Session = Depends(get_db)
):
    facility = db.query(models.Facility).filter(
        models.Facility.id == facility_id
    ).first()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    return facility