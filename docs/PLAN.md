# 개발계획: 오늘 뭐 먹지?

## 1. DB 설계 (MariaDB)

관계: restaurants 1 : N (visits, reviews, exclusions). 자식 테이블의 restaurant_id는 외래키(FK)이며, 식당 삭제 시 함께 삭제(ON DELETE CASCADE).

### restaurants
| 컬럼 | 설명 |
|---|---|
| id | PK, 자동 증가 |
| name | 이름 (필수) |
| category | 한식/중식/일식/양식/분식/기타 (필수) |
| price_range | 가격대 구간 (필수) |
| walk_minutes | 도보 시간(분) (필수) |
| is_cold | 차가운 음식 여부 |
| is_soup | 국물 요리 여부 |
| menu | 대표 메뉴 (선택) |
| location | 위치 (선택) |
| memo | 메모 (선택) |
| created_by | 추천자(로그인 아이디) |
| created_at | 등록 시각 |

### visits
| 컬럼 | 설명 |
|---|---|
| id | PK |
| restaurant_id | FK → restaurants.id |
| visited_by | 확정한 로그인 아이디 |
| visited_date | 방문 날짜 |

### reviews
| 컬럼 | 설명 |
|---|---|
| id | PK |
| restaurant_id | FK → restaurants.id |
| nickname | 작성자(로그인 아이디) |
| rating | 1~5 |
| comment | 한줄평 (선택) |
| updated_at | 수정 시각 |

- UNIQUE (restaurant_id, nickname): 1인 1식당 1별점
- 컬럼명은 nickname이지만 값은 로그인 아이디다.

### exclusions
| 컬럼 | 설명 |
|---|---|
| id | PK |
| restaurant_id | FK → restaurants.id |
| excluded_by | 제외한 로그인 아이디 |
| excluded_date | 제외한 날짜 (조회 시 오늘 날짜만 유효) |

- UNIQUE (restaurant_id, excluded_date): 같은 날 같은 식당 중복 제외 금지

### users
| 컬럼 | 설명 |
|---|---|
| id | PK |
| username | 아이디 겸 표시 이름 (UNIQUE, 2~20자) |
| password_hash | 비밀번호 해시(scrypt). 원문은 저장하지 않는다 |
| created_at | 가입 시각 |

### auth_sessions
| 컬럼 | 설명 |
|---|---|
| id | PK |
| token_hash | 로그인 토큰의 해시 (UNIQUE). 토큰 원문은 저장하지 않는다 |
| user_id | FK → users.id (ON DELETE CASCADE) |
| expires_at | 만료 시각 (30일) |

## 2. API 설계 (FastAPI) — 초안

식당/별점/방문/제외 쓰기 API는 로그인(Bearer 토큰)이 필요하고, 작성자는 서버가 토큰으로 정한다.

| 기능 | 메서드 / 경로 | 설명 |
|---|---|---|
| 회원가입 | POST /auth/signup | 가입 후 바로 로그인 토큰 반환 |
| 로그인 | POST /auth/login | 토큰 반환 |
| 내 정보 / 로그아웃 | GET /auth/me, POST /auth/logout | Bearer 토큰 필요 |
| 식당 목록 | GET /restaurants | 전체 목록 |
| 식당 등록 | POST /restaurants | |
| 식당 상세 | GET /restaurants/{id} | 평균 별점, 한줄평, 최근 방문일 포함 |
| 식당 수정 | PUT /restaurants/{id} | |
| 식당 삭제 | DELETE /restaurants/{id} | |
| 별점 등록/수정 | PUT /restaurants/{id}/review | 같은 아이디면 덮어쓰기 |
| 방문 확정 | POST /visits | 룰렛 결과 확정 |
| 오늘 제외 목록 | GET /exclusions | 오늘 날짜만 |
| 제외 추가 | POST /exclusions | |
| 제외 해제 | DELETE /exclusions/{id} | |
| 룰렛 후보 | GET /roulette | 쿼리: categories, max_walk, recent_days, weather → 최대 8개 반환 |

## 3. 화면 구성

상단 탭 2개(룰렛 / 식당 목록). 상세와 등록/수정은 별도 페이지가 아닌 팝업(모달)으로 띄운다.

| 화면 | 하는 일 | 쓰는 API |
|---|---|---|
| 룰렛 (메인) | 필터 설정, 룰렛 돌리기, 확정/다시 돌리기 | GET /roulette, POST /visits |
| 식당 목록 | 목록, 카테고리 필터, 오늘 제외 토글, 식당 추가 버튼 | GET /restaurants, GET·POST·DELETE /exclusions |
| 식당 상세 (팝업) | 정보, 평균 별점, 한줄평, 내 별점 입력, 수정/삭제 | GET /restaurants/{id}, PUT /restaurants/{id}/review, DELETE /restaurants/{id} |
| 식당 등록/수정 (팝업) | 식당 정보 입력 | POST /restaurants, PUT /restaurants/{id} |
| 로그인/회원가입 (팝업) | 미로그인 시 표시. 성공하면 토큰을 브라우저(localStorage `auth_token`)에 저장 | POST /auth/signup, POST /auth/login, GET /auth/me, POST /auth/logout |

- 오늘 제외 토글: 제외 안 된 식당을 누르면 POST /exclusions, 이미 제외된 식당을 누르면 DELETE /exclusions/{id}
- 방문 확정: POST /visits, 요청에는 restaurant_id만 담고, visited_by는 로그인 사용자, visited_date는 오늘 날짜로 서버가 넣는다

## 4. 배포 구조: 3티어 서버 분리

기존에는 WSL 한 곳에서 프론트, 백엔드, DB를 모두 실행했다. 이를 서버 3대로 분리한다. (PRD 5장)

```
사용자 브라우저 → [프론트엔드 서버 :80/4173] → [백엔드 서버 :8001] → [DB 서버 :3306]
                   React 빌드 서빙, /api 전달     FastAPI              MariaDB
```

| 서버 | 실행 | 외부 공개 | 받는 접속 |
|---|---|---|---|
| 프론트엔드 | React 빌드(`dist`) 서빙, `/api`를 백엔드로 전달 | 공개 (ngrok은 여기만) | 사용자 |
| 백엔드 | FastAPI(uvicorn) | 비공개 | 프론트엔드 서버에서만 |
| DB | MariaDB | 비공개 | 백엔드 서버에서만 |

현재 코드에서 바꿀 것:
- **프론트엔드**: `vite.config.js`의 백엔드 주소가 `http://localhost:8001`로 고정돼 있다. 환경변수(예: `BACKEND_URL`)로 빼서 백엔드 서버 주소를 지정한다.
- **백엔드**: `.env`의 `DB_HOST`를 DB 서버 주소로 바꾼다. `CORS_ORIGINS`는 프론트엔드 서버 주소로 맞춘다. (uvicorn은 `--host 0.0.0.0`으로 실행)
- **DB**
  - MariaDB가 외부 접속을 받도록 `bind-address`를 DB 서버 주소(또는 `0.0.0.0`)로 바꾼다.
  - 계정을 `'lunch_app'@'localhost'`가 아니라 `'lunch_app'@'<백엔드 서버 IP>'`로 만들고 `lunch_roulette.*` 권한만 준다.
  - 방화벽/보안그룹에서 3306은 백엔드 서버 IP에만 연다. 백엔드의 8001도 프론트엔드 서버 IP에만 연다.
- **데이터 이전**: 기존 WSL의 DB를 `mariadb-dump`로 내보내 DB 서버에 가져온다. (또는 `create_tables.py`로 새로 만들고 샘플 데이터를 넣는다.)
- **README**: 서버별 설치/실행 방법으로 고친다.

## 5. 작업 순서

핵심(식당 등록, 목록, 룰렛 확정)을 먼저 완성하고 나머지를 하나씩 얹는다. 각 단계 끝에 동작을 확인한다.

**진행 상황: 0~9 모두 구현 완료(WSL 한 곳에서 실행). 10~14는 3티어 서버 분리 작업으로 예정.** 실행 방법은 루트의 [README.md](../README.md) 참고.

구현하면서 계획과 달라진 점:
- 백엔드 포트는 8000 대신 8001 (8000을 다른 프로세스가 사용 중)
- DB 격리 수준을 READ COMMITTED로 설정 (동시 별점 요청 시 MariaDB 1020 오류 방지)
- 별점 저장은 INSERT ... ON DUPLICATE KEY UPDATE (원자적 업서트)
- 날씨 가중치는 후보가 8개를 초과할 때만 영향을 준다 (룰렛 칸 크기는 동일)

| 순서 | 작업 | 확인 방법 |
|---|---|---|
| 0 | 환경 세팅: MariaDB, FastAPI, React 설치, 서로 연결 | FastAPI 문서 페이지와 React 화면이 뜨고 DB 접속됨 |
| 1 | DB 테이블 4개 생성 | DB에서 테이블 목록 확인 |
| 2 | 식당 CRUD API (백엔드) | FastAPI 문서 페이지(/docs)에서 직접 호출 |
| 3 | 프론트: 닉네임 입력(이후 로그인으로 교체), 식당 목록, 등록/상세 팝업 | 화면에서 식당 등록하고 목록에 표시 |
| 4 | 룰렛 최소 버전: 후보 랜덤 8개 + 룰렛 화면 + 방문 확정 | 룰렛이 돌고 방문 기록이 저장됨 (**MVP 핵심 완성**) |
| 5 | 필터 추가: 카테고리, 도보 거리 | 조건을 바꾸면 후보가 달라짐 |
| 6 | 최근 방문 제외, 오늘 제외 | 방문/제외한 식당이 룰렛에서 빠짐 |
| 7 | 별점/한줄평 | 별점 덮어쓰기, 평균 표시 |
| 8 | 날씨 가중치 | 날씨 선택 시 해당 태그 식당이 더 자주 뽑힘 |
| 9 | 마무리: 반응형, 오류 처리, 정리 | 모바일 화면에서 확인 |
| 10 | 3티어 분리 준비: 프론트 백엔드 주소 환경변수화, 백엔드 CORS/DB_HOST 점검 | 한 대에서 주소만 바꿔도 동작 |
| 11 | DB 서버 구성: MariaDB 설치, 외부 접속 설정, 전용 계정(백엔드 IP 한정), 방화벽 | 백엔드 서버에서 `mariadb -h <DB서버> -u lunch_app -p`로 접속됨 |
| 12 | 백엔드 서버 구성: FastAPI 설치/실행, DB 서버에 테이블 생성, 데이터 이전 | 백엔드 서버의 `/docs`가 뜨고 목록 API가 응답함 |
| 13 | 프론트엔드 서버 구성: 빌드/서빙, `/api` 전달, ngrok 연결 | 외부 주소에서 화면이 뜨고 식당 등록/룰렛이 동작함 |
| 14 | 분리 검증: 프론트에서 DB/백엔드 직접 접속 차단 확인 | 외부에서 8001, 3306 접속이 막혀 있음 |
