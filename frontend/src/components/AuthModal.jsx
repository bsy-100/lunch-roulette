import { useState } from 'react'
import Modal from './Modal'

// 처음 접속하면 뜨는 로그인/회원가입 팝업. 로그인하기 전에는 닫을 수 없다.
export default function AuthModal({ onLogin, onSignup }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setConfirm('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (isSignup && password !== confirm) {
      setError('비밀번호가 서로 달라요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await (isSignup ? onSignup : onLogin)(username.trim(), password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const ready = username.trim() && password && (!isSignup || confirm)

  return (
    <Modal title={isSignup ? '회원가입' : '로그인'}>
      <div className="tabs auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!isSignup}
          className={`tab ${!isSignup ? 'active' : ''}`}
          onClick={() => switchMode('login')}
        >
          로그인
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isSignup}
          className={`tab ${isSignup ? 'active' : ''}`}
          onClick={() => switchMode('signup')}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={submit}>
        <p className="muted">
          {isSignup
            ? '아이디는 식당 추천, 방문 기록, 별점에 이름으로 표시돼요.'
            : '팀 점심 룰렛을 쓰려면 로그인해 주세요.'}
        </p>
        <div className="field">
          <label htmlFor="auth-username">아이디</label>
          <input
            id="auth-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={isSignup ? 2 : undefined}
            maxLength={20}
            placeholder={isSignup ? '2~20자 (예: 철수)' : '아이디'}
            autoComplete="username"
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="auth-password">비밀번호</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={100}
            placeholder={isSignup ? '6자 이상' : '비밀번호'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </div>
        {isSignup && (
          <div className="field">
            <label htmlFor="auth-confirm">비밀번호 확인</label>
            <input
              id="auth-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              maxLength={100}
              placeholder="한 번 더 입력"
              autoComplete="new-password"
            />
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="btn primary" disabled={!ready || busy}>
            {busy ? '잠시만요...' : isSignup ? '가입하고 시작하기' : '로그인'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
