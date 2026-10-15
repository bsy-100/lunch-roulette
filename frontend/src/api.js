// 백엔드 주소. 기본값 '/api'는 프론트 서버(vite.config.js의 proxy)가 백엔드로 전달한다.
// 서버를 분리하면 .env의 VITE_API_URL에 백엔드 주소를 직접 적는다.
export const API_URL = import.meta.env.VITE_API_URL ?? '/api'

const TOKEN_KEY = 'auth_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 저장이 막힌 환경에서는 새로고침하면 다시 로그인해야 한다
  }
}

// 로그인 요청 자체의 401(비밀번호 틀림)은 "세션 만료"가 아니므로 구분한다.
const isLoginCall = (path) => path === '/auth/login' || path === '/auth/signup'

async function request(method, path, body) {
  const token = getToken()
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // 서버가 꺼져 있거나 네트워크가 끊긴 경우 (브라우저는 "Failed to fetch"라고만 알려 준다)
    throw new Error('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.')
  }

  if (res.status === 401 && !isLoginCall(path)) {
    // 토큰이 만료됐거나 없어졌다. 앱에 알려서 로그인 팝업을 다시 띄운다.
    setToken(null)
    window.dispatchEvent(new Event('auth-expired'))
  }

  if (!res.ok) {
    let message = `요청에 실패했습니다. (${res.status})`
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') message = data.detail
      else if (res.status === 422) message = '입력값을 확인해 주세요.'
    } catch {
      // 응답이 JSON이 아니면 기본 메시지를 쓴다
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  return res.status === 204 ? null : res.json()
}

export const apiGet = (path) => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body)
export const apiPut = (path, body) => request('PUT', path, body)
export const apiDelete = (path) => request('DELETE', path)
