import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = URL.create(
    "mysql+pymysql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", "3306")),
    database=os.getenv("DB_NAME"),
    query={"charset": "utf8mb4"},
)

# READ COMMITTED: 같은 행을 동시에 고치는 요청이 와도 오래된 스냅샷 때문에
# "Record has changed since last read"(1020) 오류가 나지 않게 한다.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, isolation_level="READ COMMITTED")

SessionLocal = sessionmaker(bind=engine)


def get_db():
    """요청마다 DB 세션을 하나 열고, 끝나면 닫는다."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
