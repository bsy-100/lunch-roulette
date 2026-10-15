from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Exclusion, Restaurant, User
from schemas import ExclusionCreate, ExclusionOut
from security import current_user
from timeutil import today_kst

router = APIRouter(
    prefix="/exclusions", tags=["exclusions"], dependencies=[Depends(current_user)]
)


@router.get("", response_model=list[ExclusionOut])
def list_today_exclusions(db: Session = Depends(get_db)):
    """오늘 제외된 식당 목록. 어제 이전 기록은 날짜가 달라서 자동으로 빠진다."""
    stmt = select(Exclusion).where(Exclusion.excluded_date == today_kst())
    return db.scalars(stmt).all()


@router.post("", response_model=ExclusionOut, status_code=201)
def create_exclusion(
    body: ExclusionCreate, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    if db.get(Restaurant, body.restaurant_id) is None:
        raise HTTPException(status_code=404, detail="식당을 찾을 수 없습니다.")

    exclusion = Exclusion(
        restaurant_id=body.restaurant_id,
        excluded_by=user.username,
        excluded_date=today_kst(),
    )
    db.add(exclusion)
    try:
        db.commit()
    except IntegrityError:
        # (식당, 날짜) 유니크 제약에 걸림 = 이미 오늘 제외된 식당
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 오늘 제외된 식당입니다.")
    db.refresh(exclusion)
    return exclusion


@router.delete("/{exclusion_id}", status_code=204)
def delete_exclusion(exclusion_id: int, db: Session = Depends(get_db)):
    exclusion = db.get(Exclusion, exclusion_id)
    if exclusion is None:
        raise HTTPException(status_code=404, detail="제외 기록을 찾을 수 없습니다.")
    db.delete(exclusion)
    db.commit()
    return Response(status_code=204)
