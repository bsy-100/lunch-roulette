import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 브라우저는 같은 주소의 /api 로 요청하고, 프론트 서버가 이를 백엔드로 전달한다.
// 백엔드를 외부에 직접 열지 않아도 되고, 터널(ngrok)은 프론트 하나만 열면 된다.
const BACKEND = 'http://localhost:8001'
const proxy = {
  '/api': {
    target: BACKEND,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}

// ngrok 주소로 들어오는 요청을 허용한다. (Vite는 기본적으로 낯선 호스트를 막는다)
const allowedHosts = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy, allowedHosts },
  preview: { proxy, allowedHosts },
})
