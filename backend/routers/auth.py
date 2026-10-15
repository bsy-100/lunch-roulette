from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import AuthSession, User
from schemas import AuthOut, Credentials, SignupIn, UserOut
from security import (
    DUMMY_HASH,
    token_hash,
    bearer,
    create_session,
    current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthOut, status_code=201)
def signup(body: SignupIn, db: Session = Depends(get_db)):
    user = User(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # username 유니크 제약에 걸림 = 이미 있는 아이디
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용 중인 아이디예요.")
    db.refresh(user)
    return {"token": create_session(db, user), "username": user.username}


@router.post("/login", response_model=AuthOut)
def login(body: Credentials, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == body.username))
    ok = verify_password(body.password, user.password_hash if user else DUMMY_HASH)
    if user is None or not ok:
        # 아이디가 틀렸는지 비밀번호가 틀렸는지는 알려 주지 않는다.
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않아요.")
    return {"token": create_session(db, user), "username": user.username}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.post("/logout", status_code=204)
def logout(
    cred=Depends(bearer),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    db.execute(delete(AuthSession).where(AuthSession.token_hash == token_hash(cred.credentials)))
    db.commit()
    return Response(status_code=204)
