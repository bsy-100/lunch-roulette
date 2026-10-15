import random
from datetime import timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Exclusion, Restaurant, Visit
from schemas import Category, RestaurantOut
from security import current_user
from timeutil import today_kst

router = APIRouter(prefix="/roulette", tags=["roulette"], dependencies=[Depends(current_user)])

MAX_CANDIDATES = 8
WEATHER_WEIGHT = 2  # 날씨에 맞는 식당이 뽑힐 확률 배수

Weather = Literal["더움", "추움", "비"]
# 날씨 → 가중치를 줄 식당 특징(모델의 컬럼 이름)
WEATHER_TAG = {"더움": "is_cold", "추움": "is_soup", "비": "is_soup"}


def weighted_sample(items: list[Restaurant], weights: list[float], k: int) -> list[Restaurant]:
    """가중치에 비례하는 확률로, 중복 없이 k개를 뽑는다.

    각 항목에 random() ** (1 / 가중치) 점수를 매기고 점수가 큰 순서로 k개를 고른다.
    가중치가 2배면 점수가 높게 나올 확률이 그만큼 커진다.
    """
    scored = [(random.random() ** (1 / w), item) for item, w in zip(items, weights)]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [item for _, item in scored[:k]]


@router.get("", response_model=list[RestaurantOut])
def roulette_candidates(
    categories: list[Category] | None = Query(default=None),
    max_walk: int | None = Query(default=None, ge=0, le=180),
    recent_days: int | None = Query(default=None, ge=0, le=365),
    weather: Weather | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """조건에 맞는 식당 중 무작위로 최대 8개를 룰렛 후보로 뽑는다.

    categories: 지정한 카테고리 중 하나에 속하는 식당만 (여러 개 가능)
    max_walk: 도보 시간이 이 값(분) 이하인 식당만
    recent_days: 최근 N일 안에 방문한 식당 제외 (비우거나 0이면 적용 안 함)
    weather: 날씨에 맞는 식당(더움=차가운 음식, 추움/비=국물 요리)이 2배 잘 뽑힘
    오늘 제외된 식당은 항상 빠진다.
    """
    today = today_kst()
    stmt = select(Restaurant)

    if categories:
        stmt = stmt.where(Restaurant.category.in_(categories))
    if max_walk is not None:
        stmt = stmt.where(Restaurant.walk_minutes <= max_walk)

    excluded_today = select(Exclusion.restaurant_id).where(Exclusion.excluded_date == today)
    stmt = stmt.where(Restaurant.id.not_in(excluded_today))

    if recent_days:
        since = today - timedelta(days=recent_days)
        recently_visited = select(Visit.restaurant_id).where(Visit.visited_date >= since)
        stmt = stmt.where(Restaurant.id.not_in(recently_visited))

    # 조건을 통과한 식당 전체(팀 규모에서는 수십~수백 개)에서 가중 무작위로 8개를 뽑는다.
    pool = list(db.scalars(stmt).all())

    tag = WEATHER_TAG.get(weather)
    weights = [WEATHER_WEIGHT if tag and getattr(r, tag) else 1 for r in pool]

    return weighted_sample(pool, weights, MAX_CANDIDATES)
