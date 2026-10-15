import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import engine
from routers import auth, exclusions, restaurants, roulette, visits

load_dotenv()

app = FastAPI()
app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(roulette.router)
app.include_router(visits.router)
app.include_router(exclusions.router)

# 프론트엔드(다른 주소)에서 이 API를 호출할 수 있게 허용할 출처 목록
origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"db": "ok"}
