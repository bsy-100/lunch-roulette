# 오늘 뭐 먹지? (팀 점심 룰렛)

팀원들이 함께 식당을 모으고, 조건(음식 종류, 최근 방문, 날씨, 도보 거리)에 맞춰 룰렛을 돌려 오늘 점심을 정하는 웹앱.

- 프론트엔드: React (Vite) — `frontend/`
- 백엔드: FastAPI — `backend/`
- 데이터베이스: MariaDB
- 문서: [PRD](docs/PRD.md), [개발계획](docs/PLAN.md)

## 구조

```
브라우저 → React(:5173) → FastAPI(:8001) → MariaDB(:3306)
```

DB 접근은 백엔드만 하며, DB 접속 정보는 `backend/.env`에만 둔다.

## 처음 한 번만 (설치)

### 1. DB와 전용 계정 (MariaDB 관리자로 접속: `sudo mariadb`)

```sql
CREATE DATABASE lunch_roulette CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lunch_app'@'localhost' IDENTIFIED BY '비밀번호';
GRANT ALL PRIVILEGES ON lunch_roulette.* TO 'lunch_app'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 백엔드

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # .env를 열어 DB_PASSWORD를 위에서 정한 비밀번호로 수정
python create_tables.py     # 테이블 4개 생성
```

### 3. 프론트엔드

```bash
cd frontend
npm install
```

## 실행

터미널 두 개를 연다.

```bash
# 터미널 1: 백엔드
cd backend && source .venv/bin/activate
uvicorn main:app --reload --port 8001
```

```bash
# 터미널 2: 프론트엔드
cd frontend
npm run dev
```

- 앱: http://localhost:5173
- API 문서(직접 호출해 볼 수 있음): http://localhost:8001/docs
- 상태 확인: http://localhost:8001/health, http://localhost:8001/health/db

## 팀원에게 공개하기 (ngrok)

브라우저는 같은 주소의 `/api`로 요청하고, 프론트 서버가 이를 로컬 백엔드(8001)로 전달한다(`frontend/vite.config.js`).
그래서 **터널은 프론트 하나만** 열면 되고, 백엔드와 DB는 내 컴퓨터 안에만 열려 있다.

```bash
# 터미널 1: 백엔드 (평소와 같음)
cd backend && source .venv/bin/activate
uvicorn main:app --port 8001

# 터미널 2: 프론트를 빌드해서 실행 (개발 서버보다 가볍고 안정적)
cd frontend
npm run build
npm run preview -- --port 4173

# 터미널 3: 터널 열기 (최초 1회는 ngrok authtoken 등록 필요: ngrok config add-authtoken <토큰>)
ngrok http 4173
```

터미널에 나온 `https://....ngrok-free.app`(또는 `.dev`) 주소를 팀원에게 공유한다.

- 로그인이 없으므로 **주소를 아는 사람은 누구나 식당을 추가·삭제할 수 있다.** 팀에게만 공유하고, 쓰지 않을 때는 ngrok을 끈다(Ctrl+C).
- 무료 플랜에서는 처음 접속할 때 ngrok 안내 화면이 나올 수 있다. "Visit Site"를 누르면 된다.
- 내 컴퓨터(백엔드, 프론트, ngrok)가 켜져 있는 동안만 접속할 수 있다.
- 프론트 코드를 고친 뒤에는 `npm run build`를 다시 실행해야 반영된다.

## 설정 (환경변수)

| 위치 | 이름 | 설명 |
|---|---|---|
| `backend/.env` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | DB 접속 정보 (git에 올리지 않는다) |
| `backend/.env` | `CORS_ORIGINS` | API 호출을 허용할 프론트엔드 주소 (쉼표로 구분) |
| `frontend/.env` | `VITE_API_URL` | 백엔드 주소. 비우면 `/api`를 쓰고 프론트 서버가 `localhost:8001`로 전달한다. 서버를 분리할 때만 직접 적는다 |

계층별 서버를 분리할 때는 위 값만 바꾸면 된다.

## 기능

- 식당 등록/수정/삭제/상세 (카테고리, 가격대, 도보 시간, 메뉴, 위치, 메모, 특징 태그)
- 룰렛: 음식 종류, 도보 시간, 최근 방문 제외, 날씨(더움/추움/비) 가중치
- 방문 기록 (룰렛 결과 확정 시 저장)
- 오늘 제외 (당일만, 팀 전체 적용)
- 별점과 한줄평 (1인 1식당 1개)
- 로그인 없이 닉네임만 사용 (브라우저에 저장)

## 주의

- 포트 8000이 이미 사용 중인 환경이라 백엔드는 8001을 쓴다. 바꾸려면 uvicorn의 `--port`와 `frontend/vite.config.js`의 `BACKEND` 주소를 함께 바꾼다.
- 로그인이 없어서 누구나 다른 사람의 닉네임으로 별점을 남길 수 있다. 신뢰할 수 있는 팀 내부용이다.
