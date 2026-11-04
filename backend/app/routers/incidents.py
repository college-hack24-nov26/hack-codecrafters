
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import IncidentCreate, IncidentUpdate, IncidentResponse
from .auth import require_roles


router = APIRouter(
    prefix="/incidents",
    tags=["Incident Management - INVESTIGATE"]
)


# 1. Create incident - Admin, Transport, Receiving
@router.post(
    "/",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_roles("Admin", "Transport", "Receiving"))
    ]
)
def create_incident(
    incident_data: IncidentCreate,
    db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(
        models.Batch.id == incident_data.batch_id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    new_incident = models.Incident(
        **incident_data.model_dump(exclude_none=True)
    )

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    return new_incident


# 2. Get all incidents - All authorized roles
@router.get(
    "/",
    response_model=list[IncidentResponse],
    dependencies=[
        Depends(require_roles("Admin", "Transport", "Receiving", "QC"))
    ]
)
def get_all_incidents(db: Session = Depends(get_db)):
    return (
        db.query(models.Incident)
        .order_by(models.Incident.id.desc())
        .all()
    )


# 3. Get incidents by batch - All authorized roles
@router.get(
    "/batch/{batch_id}",
    response_model=list[IncidentResponse],
    dependencies=[
        Depends(require_roles("Admin", "Transport", "Receiving", "QC"))
    ]
)
def get_batch_incidents(
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

    return (
        db.query(models.Incident)
        .filter(models.Incident.batch_id == batch_id)
        .order_by(models.Incident.id.desc())
        .all()
    )


# 4. Get incident by ID - All authorized roles
@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
    dependencies=[
        Depends(require_roles("Admin", "Transport", "Receiving", "QC"))
    ]
)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = db.query(models.Incident).filter(
        models.Incident.id == incident_id
    ).first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return incident


# 5. Update incident - Admin, QC
@router.patch(
    "/{incident_id}",
    response_model=IncidentResponse,
    dependencies=[
        Depends(require_roles("Admin", "QC"))
    ]
)
def update_incident(
    incident_id: int,
    incident_data: IncidentUpdate,
    db: Session = Depends(get_db)
):
    incident = db.query(models.Incident).filter(
        models.Incident.id == incident_id
    ).first()

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    update_data = incident_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is None and field in ("status", "severity"):
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null"
            )

        setattr(incident, field, value)

    db.commit()
    db.refresh(incident)

    return incident
