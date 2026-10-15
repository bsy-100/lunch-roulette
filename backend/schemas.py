"""API로 주고받는 데이터의 모양과 검사 규칙."""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Category = Literal["한식", "중식", "일식", "양식", "분식", "기타"]
PriceRange = Literal["~1만원", "1~1.5만원", "1.5만원~"]


class RestaurantBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    category: Category
    price_range: PriceRange
    walk_minutes: int = Field(ge=0, le=180)
    is_cold: bool = False
    is_soup: bool = False
    menu: str | None = Field(default=None, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    memo: str | None = None


class RestaurantUpdate(RestaurantBase):
    pass


class RestaurantOut(RestaurantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_by: str
    created_at: datetime


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nickname: str
    rating: int
    comment: str | None
    updated_at: datetime


class ReviewUpsert(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=200)


class VisitCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    restaurant_id: int


class VisitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    visited_by: str
    visited_date: date


class ExclusionCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    restaurant_id: int


class ExclusionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    restaurant_id: int
    excluded_by: str
    excluded_date: date


class RestaurantDetail(RestaurantOut):
    avg_rating: float | None
    review_count: int
    last_visited: date | None
    reviews: list[ReviewOut]


class Credentials(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=1, max_length=20)
    password: str = Field(min_length=1, max_length=100)


class SignupIn(Credentials):
    # 가입할 때만 길이 규칙을 건다. 로그인은 위 Credentials로 받아 규칙을 알려 주지 않는다.
    username: str = Field(min_length=2, max_length=20)
    password: str = Field(min_length=6, max_length=100)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str


class AuthOut(UserOut):
    token: str
