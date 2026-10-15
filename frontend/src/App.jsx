import { useState } from 'react'
import AuthModal from './components/AuthModal'
import RestaurantList from './components/RestaurantList'
import Roulette from './components/Roulette'
import { useAuth } from './useAuth'
import './App.css'

function App() {
  const { user, checking, login, signup, logout } = useAuth()
  const [tab, setTab] = useState('roulette')

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍱 오늘 뭐 먹지?</h1>
        {user && (
          <span className="user">
            {user}님 ·{' '}
            <button className="chip" onClick={logout}>
              로그아웃
            </button>
          </span>
        )}
      </header>

      {/* 로그인 전에는 데이터를 요청하는 화면을 아예 그리지 않는다. */}
      {user && (
        <>
          <nav className="tabs">
            <button className={`tab ${tab === 'roulette' ? 'active' : ''}`} onClick={() => setTab('roulette')}>
              🎰 룰렛
            </button>
            <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
              📋 식당 목록
            </button>
          </nav>

          {tab === 'roulette' ? <Roulette /> : <RestaurantList nickname={user} />}
        </>
      )}

      {!user && !checking && <AuthModal onLogin={login} onSignup={signup} />}
    </div>
  )
}

export default App
