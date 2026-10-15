import { useEffect, useState } from 'react'
import { apiGet } from '../api'
import Modal from './Modal'
import Row from './Row'

// 룰렛에서 뽑힌 식당 정보 팝업. 목록에 이미 있는 정보는 바로 보여 주고,
// 별점·최근 방문처럼 따로 계산하는 정보는 상세 API로 가져와 채운다.
export default function WinnerModal({ restaurant, error, onConfirm, onRespin, onClose }) {
  const [extra, setExtra] = useState(null)

  useEffect(() => {
    let ignore = false
    apiGet(`/restaurants/${restaurant.id}`)
      .then((data) => !ignore && setExtra(data))
      .catch(() => {
        // 추가 정보를 못 불러와도 기본 정보는 이미 보이므로 조용히 넘어간다
      })
    return () => {
      ignore = true
    }
  }, [restaurant.id])

  const tags = [restaurant.is_cold && '차가운 음식', restaurant.is_soup && '국물 요리'].filter(Boolean)

  return (
    <Modal title={`🎉 ${restaurant.name}`} onClose={onClose}>
      <Row label="카테고리">{restaurant.category}</Row>
      <Row label="가격대">{restaurant.price_range}</Row>
      <Row label="도보">{restaurant.walk_minutes}분</Row>
      {tags.length > 0 && <Row label="특징">{tags.join(', ')}</Row>}
      {restaurant.menu && <Row label="대표 메뉴">{restaurant.menu}</Row>}
      {restaurant.location && <Row label="위치">{restaurant.location}</Row>}
      {restaurant.memo && <Row label="메모">{restaurant.memo}</Row>}
      {extra && (
        <>
          <Row label="평균 별점">
            {extra.avg_rating !== null ? `★ ${extra.avg_rating} (${extra.review_count}명)` : '아직 없음'}
          </Row>
          <Row label="최근 방문">{extra.last_visited ?? '기록 없음'}</Row>
          {extra.reviews.length > 0 && (
            <ul className="reviews">
              {extra.reviews.slice(0, 3).map((r) => (
                <li key={r.nickname}>
                  <strong>{r.nickname}</strong> ★{r.rating}
                  {r.comment && <span className="muted"> · {r.comment}</span>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button className="btn" onClick={onRespin}>
          다시 돌리기
        </button>
        <button className="btn primary" onClick={onConfirm}>
          여기로 확정
        </button>
      </div>
    </Modal>
  )
}
