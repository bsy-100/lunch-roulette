import { useState } from 'react'
import { apiPut } from '../api'

// 내 별점/한줄평 입력. 이미 남긴 적이 있으면 그 값을 채워 두고, 저장하면 덮어쓴다.
export default function ReviewForm({ restaurantId, mine, onSaved }) {
  const [rating, setRating] = useState(mine?.rating ?? 0)
  const [comment, setComment] = useState(mine?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPut(`/restaurants/${restaurantId}/review`, {
        rating,
        comment: comment.trim() || null,
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="label">{mine ? '내 평가 수정' : '별점 남기기'}</div>
      <div className="stars" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={`star ${n <= rating ? 'on' : ''}`}
            onClick={() => setRating(n)}
            role="radio"
            aria-checked={n === rating}
            aria-label={`${n}점`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={200}
        placeholder="한줄평 (선택)"
      />
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={rating === 0 || saving}>
        {saving ? '저장 중...' : mine ? '수정하기' : '남기기'}
      </button>
    </form>
  )
}
