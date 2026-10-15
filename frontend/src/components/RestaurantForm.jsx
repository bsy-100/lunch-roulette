import { useState } from 'react'
import { apiPost, apiPut } from '../api'
import { CATEGORIES, PRICE_RANGES } from '../constants'
import Modal from './Modal'

const EMPTY = {
  name: '',
  category: CATEGORIES[0],
  price_range: PRICE_RANGES[0],
  walk_minutes: 5,
  is_cold: false,
  is_soup: false,
  menu: '',
  location: '',
  memo: '',
}

// 식당 등록/수정 폼. restaurant가 있으면 수정, 없으면 등록.
export default function RestaurantForm({ restaurant, onSaved, onClose }) {
  const [form, setForm] = useState(() =>
    restaurant
      ? {
          name: restaurant.name,
          category: restaurant.category,
          price_range: restaurant.price_range,
          walk_minutes: restaurant.walk_minutes,
          is_cold: restaurant.is_cold,
          is_soup: restaurant.is_soup,
          menu: restaurant.menu ?? '',
          location: restaurant.location ?? '',
          memo: restaurant.memo ?? '',
        }
      : EMPTY,
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // 선택 항목은 비어 있으면 null로 보낸다. PUT은 모든 필드를 통째로 덮어쓰기 때문.
    const payload = {
      ...form,
      walk_minutes: Number(form.walk_minutes),
      menu: form.menu.trim() || null,
      location: form.location.trim() || null,
      memo: form.memo.trim() || null,
    }

    try {
      const saved = restaurant
        ? await apiPut(`/restaurants/${restaurant.id}`, payload)
        : await apiPost('/restaurants', payload)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={restaurant ? '식당 수정' : '식당 추가'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="f-name">이름 *</label>
          <input id="f-name" type="text" value={form.name} onChange={set('name')} maxLength={100} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="f-category">카테고리 *</label>
          <select id="f-category" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-price">가격대 *</label>
          <select id="f-price" value={form.price_range} onChange={set('price_range')}>
            {PRICE_RANGES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-walk">도보 시간(분) *</label>
          <input id="f-walk" type="number" min="0" max="180" value={form.walk_minutes} onChange={set('walk_minutes')} required />
        </div>
        <div className="field">
          <span className="label">특징</span>
          <div className="checks">
            <label>
              <input type="checkbox" checked={form.is_cold} onChange={set('is_cold')} /> 차가운 음식
            </label>
            <label>
              <input type="checkbox" checked={form.is_soup} onChange={set('is_soup')} /> 국물 요리
            </label>
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-menu">대표 메뉴</label>
          <input id="f-menu" type="text" value={form.menu} onChange={set('menu')} maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="f-location">위치</label>
          <input id="f-location" type="text" value={form.location} onChange={set('location')} maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="f-memo">메모</label>
          <textarea id="f-memo" rows={3} value={form.memo} onChange={set('memo')} />
        </div>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            취소
          </button>
          <button className="btn primary" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
