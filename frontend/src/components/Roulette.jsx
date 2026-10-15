import { useEffect, useRef, useState } from 'react'
import { apiGet, apiPost } from '../api'
import { CATEGORIES, DEFAULT_RECENT_DAYS, RECENT_OPTIONS, WALK_OPTIONS, WEATHER_OPTIONS } from '../constants'
import Confetti from './Confetti'
import Wheel from './Wheel'
import WinnerModal from './WinnerModal'

const DEFAULT_FILTERS = { categories: [], maxWalk: '', recentDays: DEFAULT_RECENT_DAYS, weather: '' }

function buildQuery({ categories, maxWalk, recentDays, weather }) {
  const params = new URLSearchParams()
  categories.forEach((c) => params.append('categories', c))
  if (maxWalk) params.set('max_walk', maxWalk)
  if (recentDays) params.set('recent_days', recentDays)
  if (weather) params.set('weather', weather)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export default function Roulette() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [candidates, setCandidates] = useState(null)
  const [error, setError] = useState('')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null) // 돌리는 중에는 정해져 있지만 아직 공개하지 않는다
  const [shown, setShown] = useState(null) // 멈춘 뒤 공개된 결과
  const [confirmed, setConfirmed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [showInfo, setShowInfo] = useState(false) // 당첨 식당 정보 팝업
  const infoTimer = useRef(null)

  // 화면을 떠날 때 예약된 팝업이 뒤늦게 뜨지 않게 정리한다.
  useEffect(() => () => clearTimeout(infoTimer.current), [])

  // 필터가 바뀌거나 후보를 새로 뽑을 때마다 백엔드에서 후보를 가져온다.
  useEffect(() => {
    let ignore = false
    apiGet(`/roulette${buildQuery(filters)}`)
      .then((data) => {
        if (ignore) return
        setCandidates(data)
        setError('')
      })
      .catch((e) => !ignore && setError(e.message))
    return () => {
      ignore = true // 필터를 빠르게 바꿀 때 늦게 도착한 이전 응답을 버린다
    }
  }, [filters, reloadKey])

  const resetResult = () => {
    clearTimeout(infoTimer.current)
    setShowInfo(false)
    setCandidates(null)
    setShown(null)
    setWinner(null)
    setConfirmed(false)
  }

  const refresh = () => {
    resetResult()
    setReloadKey((k) => k + 1)
  }

  const changeFilters = (next) => {
    resetResult()
    setFilters(next)
  }

  const toggleCategory = (category) => {
    const has = filters.categories.includes(category)
    changeFilters({
      ...filters,
      categories: has ? filters.categories.filter((c) => c !== category) : [...filters.categories, category],
    })
  }

  const spin = () => {
    const index = Math.floor(Math.random() * candidates.length)
    const step = 360 / candidates.length
    // 당첨 칸의 중심이 12시 방향(포인터)에 오도록 돌린다. 칸 안에서 조금 어긋나게 멈추도록 흔든다.
    const jitter = (Math.random() - 0.5) * step * 0.7
    const center = index * step + step / 2
    const next = rotation + 360 * 5 + ((((360 - center + jitter - (rotation % 360)) % 360) + 360) % 360)

    clearTimeout(infoTimer.current)
    setShowInfo(false)
    setShown(null)
    setConfirmed(false)
    setWinner(candidates[index])
    setSpinning(true)
    setRotation(next)
  }

  const onSpinEnd = () => {
    if (!spinning) return
    setSpinning(false)
    setShown(winner)
    // 색종이가 먼저 터지는 걸 보여 준 뒤 정보 팝업을 띄운다.
    infoTimer.current = setTimeout(() => setShowInfo(true), 900)
  }

  const confirm = async () => {
    try {
      await apiPost('/visits', { restaurant_id: shown.id })
      setConfirmed(true)
      setShowInfo(false)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  const respin = () => {
    setShowInfo(false)
    spin()
  }

  const isDefault =
    filters.categories.length === 0 &&
    filters.maxWalk === '' &&
    filters.recentDays === DEFAULT_RECENT_DAYS &&
    filters.weather === ''
  const weatherHint = WEATHER_OPTIONS.find((w) => w.value === filters.weather)?.hint

  return (
    <section className="roulette">
      <div className="filters">
        <div className="filter-row">
          <span className="label">음식 종류</span>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`chip ${filters.categories.includes(c) ? 'active' : ''}`}
                onClick={() => toggleCategory(c)}
                disabled={spinning}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <label className="label" htmlFor="walk">
            도보
          </label>
          <select
            id="walk"
            value={filters.maxWalk}
            onChange={(e) => changeFilters({ ...filters, maxWalk: e.target.value })}
            disabled={spinning}
          >
            <option value="">제한 없음</option>
            {WALK_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}분 이내
              </option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <span className="label">오늘 날씨</span>
          <div className="chips">
            {WEATHER_OPTIONS.map((w) => (
              <button
                key={w.value}
                className={`chip ${filters.weather === w.value ? 'active' : ''}`}
                onClick={() => changeFilters({ ...filters, weather: filters.weather === w.value ? '' : w.value })}
                disabled={spinning}
              >
                {w.label}
              </button>
            ))}
          </div>
          {weatherHint && <span className="muted">{weatherHint}</span>}
        </div>
        <div className="filter-row">
          <label className="label" htmlFor="recent">
            최근 방문
          </label>
          <select
            id="recent"
            value={filters.recentDays}
            onChange={(e) => changeFilters({ ...filters, recentDays: e.target.value })}
            disabled={spinning}
          >
            <option value="">제외 안 함</option>
            {RECENT_OPTIONS.map((d) => (
              <option key={d} value={d}>
                최근 {d}일 안에 간 곳 제외
              </option>
            ))}
          </select>
          {!isDefault && (
            <button className="chip" onClick={() => changeFilters(DEFAULT_FILTERS)} disabled={spinning}>
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!candidates && !error && <p className="empty">후보를 뽑는 중...</p>}

      {candidates?.length === 0 && (
        <p className="empty">
          조건에 맞는 식당이 없어요. 필터를 바꾸거나, 오늘 제외·최근 방문으로 빠진 식당이 없는지 확인해 보세요.
        </p>
      )}

      {candidates?.length > 0 && (
        <>
          <Wheel items={candidates} rotation={rotation} spinning={spinning} onSpinEnd={onSpinEnd} />

          <div className="result">
            {shown ? (
              <>
                {/* rotation을 key로 써서 다시 돌릴 때마다 연출이 새로 시작되게 한다 */}
                <div className="result-card" key={rotation}>
                  <div className="result-label">🎉 오늘의 점심!</div>
                  <div className="result-name">{shown.name}</div>
                  <div className="muted">
                    {shown.category} · {shown.price_range} · 도보 {shown.walk_minutes}분
                  </div>
                </div>
                <Confetti key={`confetti-${rotation}`} />
              </>
            ) : (
              <div className="muted">{spinning ? '두근두근...' : '돌리기 버튼을 눌러 보세요!'}</div>
            )}
          </div>

          <div className="roulette-actions">
            {confirmed ? (
              <>
                <p>✅ {shown.name} 방문을 기록했어요. 맛있게 드세요!</p>
                <button className="btn" onClick={refresh}>
                  새 룰렛 만들기
                </button>
              </>
            ) : (
              <>
                <button className="btn primary" onClick={spin} disabled={spinning}>
                  {shown ? '🎰 다시 돌리기' : '🎰 돌리기!'}
                </button>
                {shown && (
                  <button className="btn" onClick={confirm}>
                    여기로 확정
                  </button>
                )}
                <button className="btn" onClick={refresh} disabled={spinning}>
                  후보 새로 뽑기
                </button>
              </>
            )}
          </div>
        </>
      )}

      {showInfo && shown && (
        <WinnerModal
          restaurant={shown}
          error={error}
          onConfirm={confirm}
          onRespin={respin}
          onClose={() => setShowInfo(false)}
        />
      )}
    </section>
  )
}
