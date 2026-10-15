// 백엔드 schemas.py의 Category, PriceRange와 같은 값이어야 한다.
export const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '기타']
export const PRICE_RANGES = ['~1만원', '1~1.5만원', '1.5만원~']
// 룰렛 칸에 붙는 카테고리 이모지
export const CATEGORY_EMOJI = { 한식: '🍚', 중식: '🥟', 일식: '🍣', 양식: '🍝', 분식: '🍢', 기타: '🍜' }
// 룰렛 필터의 "도보 N분 이내" 선택지
export const WALK_OPTIONS = [5, 10, 15, 20]
// 룰렛 필터의 날씨 선택지. hint는 어떤 식당이 더 잘 뽑히는지 안내하는 문구
export const WEATHER_OPTIONS = [
  { value: '더움', label: '☀️ 더움', hint: '차가운 음식이 2배 잘 뽑혀요' },
  { value: '추움', label: '❄️ 추움', hint: '국물 요리가 2배 잘 뽑혀요' },
  { value: '비', label: '🌧️ 비', hint: '국물 요리가 2배 잘 뽑혀요' },
]
// 룰렛 필터의 "최근 N일 안에 간 곳 제외" 선택지와 기본값
export const RECENT_OPTIONS = [3, 7, 14]
export const DEFAULT_RECENT_DAYS = '7'
