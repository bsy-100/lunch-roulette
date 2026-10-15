import { useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../api'
import { CATEGORIES } from '../constants'
import RestaurantDetail from './RestaurantDetail'
import RestaurantForm from './RestaurantForm'

export default function RestaurantList({ nickname }) {
  const [items, setItems] = useState(null)
  const [exclusions, setExclusions] = useState([]) // 오늘 제외된 식당들
  const [error, setError] = useState('')
  const [category, setCategory] = useState('전체')
  // 열려 있는 팝업: null | { type: 'detail', id } | { type: 'form', restaurant }
  const [view, setView] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    Promise.all([apiGet('/restaurants'), apiGet('/exclusions')])
      .then(([restaurants, excluded]) => {
        setItems(restaurants)
        setExclusions(excluded)
        setError('')
      })
      .catch((e) => setError(e.message))
  }, [reloadKey])

  const reload = () => setReloadKey((k) => k + 1)
  const close = () => setView(null)

  // 식당 id → 오늘 제외 기록
  const excludedById = new Map(exclusions.map((e) => [e.restaurant_id, e]))

  const toggleExclude = async (restaurant) => {
    const current = excludedById.get(restaurant.id)
    try {
      if (current) await apiDelete(`/exclusions/${current.id}`)
      else await apiPost('/exclusions', { restaurant_id: restaurant.id })
      reload()
    } catch (e) {
      setError(e.message)
      reload() // 다른 팀원이 먼저 바꿨을 수 있으니 최신 상태로 맞춘다
    }
  }

  const shown = items?.filter((r) => category === '전체' || r.category === category)

  return (
    <section>
      <div className="toolbar">
        <div className="chips">
          {['전체', ...CATEGORIES].map((c) => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <button className="btn primary" onClick={() => setView({ type: 'form', restaurant: null })}>
          + 추가
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {!items && !error && <p className="empty">불러오는 중...</p>}
      {shown?.length === 0 && (
        <p className="empty">
          {items.length === 0 ? '아직 등록된 식당이 없어요. 첫 식당을 추가해 보세요!' : '이 카테고리에는 식당이 없어요.'}
        </p>
      )}

      <ul className="list">
        {shown?.map((r) => {
          const excluded = excludedById.get(r.id)
          return (
            <li key={r.id} className={`row ${excluded ? 'excluded' : ''}`}>
              <button className="item" onClick={() => setView({ type: 'detail', id: r.id })}>
                <div className="item-name">
                  {r.name}
                  {r.is_cold && <span className="tag cold">차가운 음식</span>}
                  {r.is_soup && <span className="tag">국물</span>}
                  {excluded && <span className="tag off">오늘 제외 · {excluded.excluded_by}</span>}
                </div>
                <div className="item-meta">
                  {r.category} · {r.price_range} · 도보 {r.walk_minutes}분 · {r.created_by} 추천
                </div>
              </button>
              <button className="btn" onClick={() => toggleExclude(r)}>
                {excluded ? '제외 해제' : '오늘 제외'}
              </button>
            </li>
          )
        })}
      </ul>

      {view?.type === 'detail' && (
        <RestaurantDetail
          id={view.id}
          nickname={nickname}
          onClose={close}
          onEdit={(restaurant) => setView({ type: 'form', restaurant })}
          onDeleted={() => {
            close()
            reload()
          }}
        />
      )}
      {view?.type === 'form' && (
        <RestaurantForm
          restaurant={view.restaurant}
          onClose={close}
          onSaved={(saved) => {
            setView({ type: 'detail', id: saved.id })
            reload()
          }}
        />
      )}
    </section>
  )
}
