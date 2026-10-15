# DB 서버 (MariaDB) — 10.10.30.30

## 1. 설치와 실행 (Amazon Linux 2023)
```bash
sudo dnf install -y mariadb105-server
sudo systemctl enable --now mariadb
sudo systemctl status mariadb          # active (running) 확인
```
> `sudo mariadb`에서 `Can't connect ... mysql.sock` 오류가 나면 서버가 꺼져 있는 것이다. 위 `enable --now`를 먼저 실행한다.

## 2. 외부(APP 서버) 접속 허용
기본값은 자기 자신(127.0.0.1)만 받는다.
```bash
sudo tee /etc/my.cnf.d/lunch-roulette.cnf <<'CNF'
[mysqld]
bind-address = 0.0.0.0
CNF
sudo systemctl restart mariadb
sudo ss -tlnp | grep 3306              # 0.0.0.0:3306 이어야 함
```

## 3. DB와 전용 계정 (`sudo mariadb`로 접속)
계정은 **APP 서버 IP(10.10.20.20)에서만** 접속하게 만든다.
```sql
CREATE DATABASE lunch_roulette CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lunch_app'@'10.10.20.20' IDENTIFIED BY '비밀번호';
GRANT ALL PRIVILEGES ON lunch_roulette.* TO 'lunch_app'@'10.10.20.20';
FLUSH PRIVILEGES;
```
비밀번호는 APP 서버의 `backend/.env` `DB_PASSWORD`와 같아야 한다.

## 4. 확인 (APP 서버에서)
```bash
sudo dnf install -y mariadb105      # 클라이언트
mariadb -h 10.10.30.30 -u lunch_app -p lunch_roulette
```
- `Connection refused`: MariaDB가 꺼졌거나 bind-address 설정 문제
- 타임아웃: DB 보안그룹이 3306을 APP에 안 열었음
- `Access denied`: 계정 IP나 비밀번호 불일치

## 기존 WSL 데이터 옮기기 (선택)
WSL에서 내보내기:
```bash
mariadb-dump -u lunch_app -p lunch_roulette > lunch_roulette.sql
```
파일을 DB 서버로 복사한 뒤 가져오기:
```bash
mariadb -u root lunch_roulette < lunch_roulette.sql     # sudo mariadb 로 접속 가능한 상태에서 sudo 사용
```
`create_tables.py`를 이미 실행했다면 같은 이름 테이블과 충돌하니, 데이터를 옮길 거면 가져오기를 먼저 한다.
