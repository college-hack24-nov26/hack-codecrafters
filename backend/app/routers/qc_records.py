
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import QCCreate, QCUpdate, QCResponse
from .auth import require_roles


router = APIRouter(
    prefix="/qc-records",
    tags=["QC Records"]
)


# 1. Create QC record - QC only
@router.post(
    "/",
    response_model=QCResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("QC"))]
)
def create_qc_record(
    qc_data: QCCreate,
    db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(
        models.Batch.id == qc_data.batch_id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    if qc_data.inspector_id is not None:
        inspector = db.query(models.User).filter(
            models.User.id == qc_data.inspector_id
        ).first()

        if not inspector:
            raise HTTPException(
                status_code=404,
                detail="Inspector user not found"
            )

    new_record = models.QCRecord(
        **qc_data.model_dump(exclude_none=True)
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


# 2. Get all QC records - Admin, Receiving, QC
@router.get(
    "/",
    response_model=list[QCResponse],
    dependencies=[
        Depends(require_roles("Admin", "Receiving", "QC"))
    ]
)
def get_all_qc_records(db: Session = Depends(get_db)):
    return (
        db.query(models.QCRecord)
        .order_by(models.QCRecord.id.desc())
        .all()
    )


# 3. Get QC records by batch - Admin, Receiving, QC
@router.get(
    "/batch/{batch_id}",
    response_model=list[QCResponse],
    dependencies=[
        Depends(require_roles("Admin", "Receiving", "QC"))
    ]
)
def get_batch_qc_records(
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
        db.query(models.QCRecord)
        .filter(models.QCRecord.batch_id == batch_id)
        .order_by(models.QCRecord.id.desc())
        .all()
    )


# 4. Get QC record by ID - Admin, Receiving, QC
@router.get(
    "/{qc_id}",
    response_model=QCResponse,
    dependencies=[
        Depends(require_roles("Admin", "Receiving", "QC"))
    ]
)
def get_qc_record(
    qc_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(models.QCRecord).filter(
        models.QCRecord.id == qc_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="QC record not found"
        )

    return record


# 5. Update QC record - QC only
@router.patch(
    "/{qc_id}",
    response_model=QCResponse,
    dependencies=[Depends(require_roles("QC"))]
)
def update_qc_record(
    qc_id: int,
    qc_data: QCUpdate,
    db: Session = Depends(get_db)
):
    record = db.query(models.QCRecord).filter(
        models.QCRecord.id == qc_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail="QC record not found"
        )

    update_data = qc_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is None and field == "qc_status":
            raise HTTPException(
                status_code=422,
                detail="QC status cannot be null"
            )

        setattr(record, field, value)

    db.commit()
    db.refresh(record)

    return record
