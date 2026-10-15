# APP(백엔드) 서버 — 10.10.20.20

## 1. 파이썬과 코드
```bash
sudo dnf install -y git python3.11
git clone https://github.com/bsy-100/lunch-roulette.git
cd lunch-roulette/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
> `requirements.txt`는 `backend/` 안에 있다. 최상위에서는 못 찾는다.

## 2. 환경 설정
```bash
cp .env.example .env
nano .env
```
```
DB_HOST=10.10.30.30
DB_PORT=3306
DB_USER=lunch_app
DB_PASSWORD=DB 서버에서 정한 비밀번호
DB_NAME=lunch_roulette
CORS_ORIGINS=http://WEB서버주소
```
nginx가 `/api`를 대신 전달하므로 브라우저 입장에서는 같은 주소다. CORS_ORIGINS는 그래도 WEB 주소로 맞춰 둔다.

## 3. 테이블 만들기 (DB 서버가 준비된 뒤)
**반드시 `backend/` 폴더 안에서** 실행한다. (`python -m backend.create_tables`처럼 최상위에서 하면 모듈을 못 찾는다.)
```bash
cd ~/lunch-roulette/backend
source .venv/bin/activate
python create_tables.py      # 테이블 6개 이름이 출력되면 성공
```

## 4. 서비스로 등록 (서버가 켜져 있는 동안 계속 실행)
```bash
sudo cp ~/lunch-roulette/deploy/lunch-roulette-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lunch-roulette-api
sudo systemctl status lunch-roulette-api
```
로그 보기: `sudo journalctl -u lunch-roulette-api -f`

## 5. 확인
```bash
curl http://localhost:8001/restaurants
```
JSON(`[]` 가능)이 나오면 백엔드와 DB 연결이 된 것이다.

코드를 갱신했을 때: `git pull` 후 `sudo systemctl restart lunch-roulette-api`
