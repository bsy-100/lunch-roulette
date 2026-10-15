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
| created_by | 추천자 닉네임 |
| created_at | 등록 시각 |

### visits
| 컬럼 | 설명 |
|---|---|
| id | PK |
| restaurant_id | FK → restaurants.id |
| visited_by | 확정한 닉네임 |
| visited_date | 방문 날짜 |

### reviews
| 컬럼 | 설명 |
|---|---|
| id | PK |
| restaurant_id | FK → restaurants.id |
| nickname | 작성자 |
| rating | 1~5 |
| comment | 한줄평 (선택) |
| updated_at | 수정 시각 |

- UNIQUE (restaurant_id, nickname): 1인 1식당 1별점

### exclusions
| 컬럼 | 설명 |
|---|---|
| id | PK |
| restaurant_id | FK → restaurants.id |
| excluded_by | 제외한 닉네임 |
| excluded_date | 제외한 날짜 (조회 시 오늘 날짜만 유효) |

- UNIQUE (restaurant_id, excluded_date): 같은 날 같은 식당 중복 제외 금지

## 2. API 설계 (FastAPI) — 초안

| 기능 | 메서드 / 경로 | 설명 |
|---|---|---|
| 식당 목록 | GET /restaurants | 전체 목록 |
| 식당 등록 | POST /restaurants | |
| 식당 상세 | GET /restaurants/{id} | 평균 별점, 한줄평, 최근 방문일 포함 |
| 식당 수정 | PUT /restaurants/{id} | |
| 식당 삭제 | DELETE /restaurants/{id} | |
| 별점 등록/수정 | PUT /restaurants/{id}/review | 같은 닉네임이면 덮어쓰기 |
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
| 닉네임 입력 | 최초 접속 시 1회, 브라우저(localStorage)에 저장 | 없음 |

- 오늘 제외 토글: 제외 안 된 식당을 누르면 POST /exclusions, 이미 제외된 식당을 누르면 DELETE /exclusions/{id}
- 방문 확정: POST /visits, 요청에 restaurant_id와 visited_by(닉네임)를 담고 visited_date는 서버가 오늘 날짜로 넣는다

## 4. 작업 순서

핵심(식당 등록, 목록, 룰렛 확정)을 먼저 완성하고 나머지를 하나씩 얹는다. 각 단계 끝에 동작을 확인한다.

**진행 상황: 0~9 모두 구현 완료.** 실행 방법은 루트의 [README.md](../README.md) 참고.

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
| 3 | 프론트: 닉네임 입력, 식당 목록, 등록/상세 팝업 | 화면에서 식당 등록하고 목록에 표시 |
| 4 | 룰렛 최소 버전: 후보 랜덤 8개 + 룰렛 화면 + 방문 확정 | 룰렛이 돌고 방문 기록이 저장됨 (**MVP 핵심 완성**) |
| 5 | 필터 추가: 카테고리, 도보 거리 | 조건을 바꾸면 후보가 달라짐 |
| 6 | 최근 방문 제외, 오늘 제외 | 방문/제외한 식당이 룰렛에서 빠짐 |
| 7 | 별점/한줄평 | 별점 덮어쓰기, 평균 표시 |
| 8 | 날씨 가중치 | 날씨 선택 시 해당 태그 식당이 더 자주 뽑힘 |
| 9 | 마무리: 반응형, 오류 처리, 정리 | 모바일 화면에서 확인 |
