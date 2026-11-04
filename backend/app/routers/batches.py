
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..schemas import BatchCreate, BatchUpdate, BatchResponse
from .auth import require_roles


router = APIRouter(
    prefix="/batches",
    tags=["Batch Management"]
)


# 1. Create a new batch - Admin only
@router.post(
    "/",
    response_model=BatchResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("Admin"))]
)
def create_batch(
    batch_data: BatchCreate,
    db: Session = Depends(get_db)
):
    existing_batch = db.query(models.Batch).filter(
        models.Batch.batch_code == batch_data.batch_code
    ).first()

    if existing_batch:
        raise HTTPException(
            status_code=409,
            detail="Batch code already exists"
        )

    new_batch = models.Batch(**batch_data.model_dump())

    try:
        db.add(new_batch)
        db.commit()
        db.refresh(new_batch)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create batch due to duplicate or invalid data"
        )

    return new_batch


# 2. Get all batches - All authorized roles
@router.get(
    "/",
    response_model=list[BatchResponse],
    dependencies=[
        Depends(require_roles("Admin", "Transport", "Receiving", "QC"))
    ]
)
def get_all_batches(db: Session = Depends(get_db)):
    batches = (
        db.query(models.Batch)
        .order_by(models.Batch.id.desc())
        .all()
    )

    return batches


# 3. Get batch by ID - All authorized roles
@router.get(
    "/{batch_id}",
    response_model=BatchResponse,
    dependencies=[
        Depends(require_roles("Admin", "Transport", "Receiving", "QC"))
    ]
)
def get_batch(
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

    return batch


# 4. Update batch - Admin only
@router.patch(
    "/{batch_id}",
    response_model=BatchResponse,
    dependencies=[Depends(require_roles("Admin"))]
)
def update_batch(
    batch_id: int,
    batch_data: BatchUpdate,
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

    update_data = batch_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is None and field in ("status", "risk_level"):
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null"
            )
        setattr(batch, field, value)

    try:
        db.commit()
        db.refresh(batch)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Batch update failed"
        )

    return batch
