"""비밀번호 해시와 로그인 토큰, '지금 로그인한 사용자' 확인."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import AuthSession, User

SESSION_DAYS = 30
_SCRYPT = {"n": 2**14, "r": 8, "p": 1}

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """scrypt(느리게 만든 해시)로 저장한다. 같은 비밀번호도 salt 때문에 매번 값이 다르다."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, **_SCRYPT)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_hex, digest_hex = stored.split("$")
        digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), **_SCRYPT)
    except ValueError:
        return False
    return hmac.compare_digest(digest.hex(), digest_hex)


# 없는 아이디로 로그인 시도할 때도 같은 시간이 걸리게 해서, 아이디 존재 여부를 눈치채지 못하게 한다.
DUMMY_HASH = hash_password("dummy-password")


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, user: User) -> str:
    """새 로그인 토큰을 만들어 돌려준다. DB에는 해시만 남는다."""
    token = secrets.token_urlsafe(32)
    db.add(
        AuthSession(
            token_hash=token_hash(token),
            user_id=user.id,
            expires_at=_now() + timedelta(days=SESSION_DAYS),
        )
    )
    # 만료된 세션은 로그인할 때 함께 정리한다.
    for old in db.scalars(select(AuthSession).where(AuthSession.expires_at < _now())):
        db.delete(old)
    db.commit()
    return token


def current_user(
    cred: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """요청 헤더의 토큰으로 로그인한 사용자를 찾는다. 없거나 만료되면 401."""
    if cred is not None:
        session = db.scalar(
            select(AuthSession).where(AuthSession.token_hash == token_hash(cred.credentials))
        )
        if session is not None and session.expires_at > _now():
            user = db.get(User, session.user_id)
            if user is not None:
                return user
    raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
