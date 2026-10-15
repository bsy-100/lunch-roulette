# 배포 안내: 3티어 서버 분리 (AWS EC2 3대)

```
사용자 → [WEB 서버 :80] → [APP 서버 10.10.20.20:8001] → [DB 서버 10.10.30.30:3306]
          nginx + React 빌드   FastAPI(uvicorn)             MariaDB
```

| 서버 | 안내서 | 설정 파일 |
|---|---|---|
| DB | [DB-SERVER.md](DB-SERVER.md) | |
| APP(백엔드) | [APP-SERVER.md](APP-SERVER.md) | [lunch-roulette-api.service](lunch-roulette-api.service) |
| WEB(프론트) | [WEB-SERVER.md](WEB-SERVER.md) | [lunch-roulette-web.conf](lunch-roulette-web.conf) |

**DB → APP → WEB 순서로** 만든다. 앞 서버가 안 되면 뒤 서버 확인이 안 된다.

## 보안그룹 (인바운드)
| 서버 | 포트 | 허용 대상 |
|---|---|---|
| WEB | 80 (443) | 사용자(0.0.0.0/0) |
| APP | 8001 | WEB 서버의 보안그룹 |
| DB | 3306 | APP 서버의 보안그룹 |
| 모두 | 22 | 내 IP만 (SSH) |

## 서버 주소 (이 프로젝트 기준)
- APP: `10.10.20.20`
- DB: `10.10.30.30`
- WEB: 사용자가 접속하는 공인 IP (EC2 콘솔에서 확인). WEB은 APP 주소만 알면 된다.

## 코드 받기 (APP, WEB 서버 공통)
```bash
sudo dnf install -y git
git clone https://github.com/bsy-100/lunch-roulette.git
```
