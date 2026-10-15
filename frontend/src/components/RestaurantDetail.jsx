import { useEffect, useState } from 'react'
import { apiDelete, apiGet } from '../api'
import Modal from './Modal'
import ReviewForm from './ReviewForm'
import Row from './Row'

export default function RestaurantDetail({ id, nickname, onEdit, onDeleted, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    apiGet(`/restaurants/${id}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [id, reloadKey])

  const remove = async () => {
    if (!window.confirm(`'${data.name}'을(를) 삭제할까요? 방문·별점 기록도 함께 삭제됩니다.`)) return
    try {
      await apiDelete(`/restaurants/${id}`)
      onDeleted()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!data) {
    return (
      <Modal title="식당 정보" onClose={onClose}>
        {error ? <p className="error">{error}</p> : <p className="muted">불러오는 중...</p>}
      </Modal>
    )
  }

  const tags = [data.is_cold && '차가운 음식', data.is_soup && '국물 요리'].filter(Boolean)
  const mine = data.reviews.find((r) => r.nickname === nickname) ?? null

  return (
    <Modal title={data.name} onClose={onClose}>
      <Row label="카테고리">{data.category}</Row>
      <Row label="가격대">{data.price_range}</Row>
      <Row label="도보">{data.walk_minutes}분</Row>
      {tags.length > 0 && <Row label="특징">{tags.join(', ')}</Row>}
      {data.menu && <Row label="대표 메뉴">{data.menu}</Row>}
      {data.location && <Row label="위치">{data.location}</Row>}
      {data.memo && <Row label="메모">{data.memo}</Row>}
      <Row label="추천">{data.created_by}</Row>
      <Row label="평균 별점">
        {data.avg_rating !== null ? `★ ${data.avg_rating} (${data.review_count}명)` : '아직 없음'}
      </Row>
      <Row label="최근 방문">{data.last_visited ?? '기록 없음'}</Row>

      {data.reviews.length > 0 && (
        <ul className="reviews">
          {data.reviews.map((r) => (
            <li key={r.nickname}>
              <strong>{r.nickname}</strong>
              {r.nickname === nickname && <span className="tag">나</span>} ★{r.rating}
              {r.comment && <span className="muted"> · {r.comment}</span>}
            </li>
          ))}
        </ul>
      )}

      <ReviewForm
        key={mine?.updated_at ?? 'new'}
        restaurantId={id}
        mine={mine}
        onSaved={() => setReloadKey((k) => k + 1)}
      />

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button className="btn danger" onClick={remove}>
          삭제
        </button>
        <button className="btn" onClick={() => onEdit(data)}>
          수정
        </button>
      </div>
    </Modal>
  )
}
