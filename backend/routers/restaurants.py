from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.orm import Session

from database import get_db
from models import Restaurant, Review, User, Visit
from schemas import (
    RestaurantBase,
    RestaurantDetail,
    RestaurantOut,
    RestaurantUpdate,
    ReviewOut,
    ReviewUpsert,
)
from security import current_user

router = APIRouter(
    prefix="/restaurants", tags=["restaurants"], dependencies=[Depends(current_user)]
)


def get_or_404(db: Session, restaurant_id: int) -> Restaurant:
    restaurant = db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=404, detail="식당을 찾을 수 없습니다.")
    return restaurant


@router.get("", response_model=list[RestaurantOut])
def list_restaurants(db: Session = Depends(get_db)):
    return db.scalars(select(Restaurant).order_by(Restaurant.id.desc())).all()


@router.post("", response_model=RestaurantOut, status_code=201)
def create_restaurant(
    body: RestaurantBase, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    # 추천자는 클라이언트가 보낸 값이 아니라 로그인한 사용자로 서버가 정한다.
    restaurant = Restaurant(**body.model_dump(), created_by=user.username)
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.get("/{restaurant_id}", response_model=RestaurantDetail)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = get_or_404(db, restaurant_id)

    reviews = db.scalars(
        select(Review)
        .where(Review.restaurant_id == restaurant_id)
        .order_by(Review.updated_at.desc())
    ).all()
    avg_rating = db.scalar(
        select(func.avg(Review.rating)).where(Review.restaurant_id == restaurant_id)
    )
    last_visited = db.scalar(
        select(func.max(Visit.visited_date)).where(Visit.restaurant_id == restaurant_id)
    )

    return {
        **RestaurantOut.model_validate(restaurant).model_dump(),
        "avg_rating": round(float(avg_rating), 1) if avg_rating is not None else None,
        "review_count": len(reviews),
        "last_visited": last_visited,
        "reviews": reviews,
    }


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int, body: RestaurantUpdate, db: Session = Depends(get_db)
):
    restaurant = get_or_404(db, restaurant_id)
    for field, value in body.model_dump().items():
        setattr(restaurant, field, value)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.put("/{restaurant_id}/review", response_model=ReviewOut)
def upsert_review(
    restaurant_id: int,
    body: ReviewUpsert,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """별점/한줄평 등록. 같은 사용자가 이미 남겼다면 덮어쓴다. (1인 1식당 1개)"""
    get_or_404(db, restaurant_id)

    # "있는지 확인 → 없으면 추가"를 두 단계로 하면 동시 요청에서 충돌하므로,
    # DB가 한 번에 처리하는 INSERT ... ON DUPLICATE KEY UPDATE를 쓴다.
    # (restaurant_id, nickname) 유니크 제약에 걸리면 새로 넣지 않고 값을 덮어쓴다.
    comment = body.comment or None
    stmt = mysql_insert(Review).values(
        restaurant_id=restaurant_id,
        nickname=user.username,
        rating=body.rating,
        comment=comment,
    )
    stmt = stmt.on_duplicate_key_update(
        rating=stmt.inserted.rating,
        comment=stmt.inserted.comment,
        updated_at=func.now(),
    )
    db.execute(stmt)
    db.commit()

    return db.scalar(
        select(Review).where(
            Review.restaurant_id == restaurant_id, Review.nickname == user.username
        )
    )


@router.delete("/{restaurant_id}", status_code=204)
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = get_or_404(db, restaurant_id)
    db.delete(restaurant)
    db.commit()
    return Response(status_code=204)
