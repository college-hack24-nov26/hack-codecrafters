from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..schemas import DecisionCreate, DecisionReview, DecisionResponse

router = APIRouter(
    prefix="/decisions",
    tags=["Decision Support"]
)


@router.post("/", response_model=DecisionResponse, status_code=201)
def create_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db)
):
    # Verify batch exists
    batch = db.query(models.Batch).filter(
        models.Batch.id == decision.batch_id
    ).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Verify incident exists, if supplied
    if decision.incident_id is not None:
        incident = db.query(models.Incident).filter(
            models.Incident.id == decision.incident_id,
            models.Incident.batch_id == decision.batch_id
        ).first()

        if not incident:
            raise HTTPException(
                status_code=404,
                detail="Incident not found for this batch"
            )

    new_decision = models.DecisionRecord(
        batch_id=decision.batch_id,
        incident_id=decision.incident_id,
        recommended_action=decision.recommended_action,
        explanation=decision.explanation,
        evidence_summary=decision.evidence_summary,
        approval_status="PENDING"
    )

    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)

    return new_decision


@router.get("/", response_model=list[DecisionResponse])
def get_decisions(db: Session = Depends(get_db)):
    return db.query(models.DecisionRecord).order_by(
        models.DecisionRecord.id.desc()
    ).all()


@router.get("/batch/{batch_id}", response_model=list[DecisionResponse])
def get_batch_decisions(
    batch_id: int,
    db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(
        models.Batch.id == batch_id
    ).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    return db.query(models.DecisionRecord).filter(
        models.DecisionRecord.batch_id == batch_id
    ).order_by(models.DecisionRecord.id.desc()).all()


@router.get("/{decision_id}", response_model=DecisionResponse)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = db.query(models.DecisionRecord).filter(
        models.DecisionRecord.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return decision


@router.patch("/{decision_id}", response_model=DecisionResponse)
def review_decision(
    decision_id: int,
    review: DecisionReview,
    db: Session = Depends(get_db)
):
    decision = db.query(models.DecisionRecord).filter(
        models.DecisionRecord.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if review.reviewed_by is not None:
        reviewer = db.query(models.User).filter(
            models.User.id == review.reviewed_by
        ).first()

        if not reviewer:
            raise HTTPException(status_code=404, detail="Reviewer not found")

    if review.approved_by is not None:
        approver = db.query(models.User).filter(
            models.User.id == review.approved_by
        ).first()

        if not approver:
            raise HTTPException(status_code=404, detail="Approver not found")

    if review.final_action is not None:
        decision.final_action = review.final_action

    decision.approval_status = review.approval_status
    decision.reviewed_by = review.reviewed_by
    decision.approved_by = review.approved_by

    if review.approval_status.upper() == "APPROVED":
        decision.approved_at = datetime.utcnow()
    else:
        decision.approved_at = None

    if (
        decision.final_action is not None
        and decision.final_action != decision.recommended_action
        and not review.reason_for_override
    ):
        raise HTTPException(
            status_code=400,
            detail="Reason for override is required when final action differs from recommendation"
        )

    decision.reason_for_override = review.reason_for_override

    db.commit()
    db.refresh(decision)

    return decision