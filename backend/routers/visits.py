from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Restaurant, User, Visit
from schemas import VisitCreate, VisitOut
from security import current_user
from timeutil import today_kst

router = APIRouter(prefix="/visits", tags=["visits"], dependencies=[Depends(current_user)])


@router.post("", response_model=VisitOut, status_code=201)
def create_visit(
    body: VisitCreate, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    if db.get(Restaurant, body.restaurant_id) is None:
        raise HTTPException(status_code=404, detail="식당을 찾을 수 없습니다.")

    # 방문 날짜와 기록한 사람은 클라이언트가 아니라 서버가 정한다.
    visit = Visit(
        restaurant_id=body.restaurant_id,
        visited_by=user.username,
        visited_date=today_kst(),
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit
