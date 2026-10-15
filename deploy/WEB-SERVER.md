# WEB(프론트엔드) 서버

React를 빌드한 파일을 nginx가 서빙하고, `/api` 요청은 APP 서버(10.10.20.20:8001)로 전달한다.

## 1. 설치
```bash
sudo dnf install -y git nginx
git clone https://github.com/bsy-100/lunch-roulette.git
```

## 2. 빌드 (Node 20.19+ 필요. vite 8 요구사항)
Amazon Linux 기본 패키지는 버전이 낮을 수 있어 nvm으로 설치한다.
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
cd ~/lunch-roulette/frontend
npm install
npm run build          # dist/ 폴더 생성
```
`VITE_API_URL`은 비워 둔다. (기본값 `/api`를 쓰고 nginx가 전달한다.)

## 3. 파일 배치와 nginx 설정
```bash
sudo mkdir -p /var/www/lunch-roulette
sudo cp -r ~/lunch-roulette/frontend/dist/* /var/www/lunch-roulette/
sudo cp ~/lunch-roulette/deploy/lunch-roulette-web.conf /etc/nginx/conf.d/
sudo nginx -t                       # syntax is ok 확인
sudo systemctl enable --now nginx
```
nginx가 기본 사이트와 충돌(80 포트 default_server)하면 `/etc/nginx/nginx.conf`의 기본 `server { ... }` 블록을 주석 처리한다.

## 4. 확인
브라우저에서 `http://WEB서버공인IP` 접속 → 화면이 뜨고 식당 목록이 보이면 성공.
`502 Bad Gateway`: APP 서버가 꺼졌거나 APP 보안그룹이 8001을 WEB에 안 열었다.

## 5. 화면 갱신(코드 변경 후)
```bash
cd ~/lunch-roulette && git pull
cd frontend && npm run build
sudo cp -r dist/* /var/www/lunch-roulette/
```
