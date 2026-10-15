import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost, getToken, setToken } from './api'

// 로그인 상태를 관리한다. user는 로그인한 아이디(없으면 null).
export function useAuth() {
  const [user, setUser] = useState(null)
  // 저장된 토큰이 있으면 서버에 확인할 때까지 로그인 팝업을 띄우지 않는다(깜빡임 방지).
  const [checking, setChecking] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    apiGet('/auth/me')
      .then((me) => setUser(me.username))
      .catch(() => {
        // 401(만료)이면 api.js가 토큰을 지웠다. 서버가 꺼진 경우라면 토큰은 남겨 두고
        // 로그인 팝업에서 오류 메시지를 보여 준다.
      })
      .finally(() => setChecking(false))
  }, [])

  // 다른 요청에서 토큰 만료(401)를 만났을 때
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth-expired', onExpired)
    return () => window.removeEventListener('auth-expired', onExpired)
  }, [])

  const authenticate = useCallback(async (path, username, password) => {
    const data = await apiPost(path, { username, password })
    setToken(data.token)
    setUser(data.username)
  }, [])

  const login = (username, password) => authenticate('/auth/login', username, password)
  const signup = (username, password) => authenticate('/auth/signup', username, password)

  const logout = async () => {
    try {
      await apiPost('/auth/logout')
    } catch {
      // 서버에 닿지 않아도 이 브라우저에서는 로그아웃한다
    }
    setToken(null)
    setUser(null)
  }

  return { user, checking, login, signup, logout }
}
