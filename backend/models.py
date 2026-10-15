from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(20))
    price_range: Mapped[str] = mapped_column(String(20))
    walk_minutes: Mapped[int]
    is_cold: Mapped[bool] = mapped_column(default=False)
    is_soup: Mapped[bool] = mapped_column(default=False)
    menu: Mapped[str | None] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    memo: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Visit(Base):
    __tablename__ = "visits"
    __table_args__ = (Index("ix_visits_visited_date", "visited_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    visited_by: Mapped[str] = mapped_column(String(50))
    visited_date: Mapped[date] = mapped_column(Date)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "nickname", name="uq_review_restaurant_nickname"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    nickname: Mapped[str] = mapped_column(String(50))
    rating: Mapped[int]
    comment: Mapped[str | None] = mapped_column(String(200))
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )


class Exclusion(Base):
    __tablename__ = "exclusions"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "excluded_date", name="uq_exclusion_restaurant_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    excluded_by: Mapped[str] = mapped_column(String(50))
    excluded_date: Mapped[date] = mapped_column(Date)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # 아이디 겸 표시 이름. 대소문자를 구분하지 않고 중복을 막는다(DB 정렬 규칙).
    username: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class AuthSession(Base):
    """로그인 상태. 토큰 원문은 저장하지 않고 해시만 저장한다."""

    __tablename__ = "auth_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    expires_at: Mapped[datetime]
