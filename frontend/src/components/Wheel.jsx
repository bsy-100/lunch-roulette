import { CATEGORY_EMOJI } from '../constants'

const SIZE = 100 // 원판 SVG 좌표계 반지름
const RING = 104 // 전구 테두리 SVG(-110~110)에서 전구가 놓이는 반지름
const BULBS = 20

// 칸 색. bg는 칸 배경, fg는 그 위에 올라가는 글자 색 (대비가 나도록 짝지음)
const PALETTE = [
  { bg: '#ff3b5c', fg: '#ffffff' },
  { bg: '#ffd23f', fg: '#1b1540' },
  { bg: '#2ec4b6', fg: '#0b2b28' },
  { bg: '#7b5cff', fg: '#ffffff' },
  { bg: '#ff8c42', fg: '#2b1200' },
]

// 인접한 칸이 같은 색이 되지 않게 고른다. (마지막 칸과 첫 칸이 이어지는 경우 포함)
function colorFor(index, count) {
  let c = index % PALETTE.length
  if (count > 1 && index === count - 1 && c === 0) c = 2
  return PALETTE[c]
}

// 12시 방향을 0도로 하고 시계 방향으로 증가하는 각도를 좌표로 바꾼다.
function polar(angle, radius) {
  const rad = ((angle - 90) * Math.PI) / 180
  return [radius * Math.cos(rad), radius * Math.sin(rad)]
}

function shorten(name) {
  return name.length > 6 ? `${name.slice(0, 5)}…` : name
}

function Bulbs() {
  return (
    <svg className="bulbs" viewBox="-110 -110 220 220" aria-hidden="true">
      <circle r={RING} fill="none" stroke="#ff3b5c" strokeWidth="14" />
      <circle r={RING + 7} fill="none" stroke="#0b0a24" strokeWidth="2.5" />
      <circle r={RING - 7} fill="none" stroke="#0b0a24" strokeWidth="2.5" />
      {Array.from({ length: BULBS }, (_, i) => {
        const [x, y] = polar((i * 360) / BULBS, RING)
        return <circle key={i} className={`bulb ${i % 2 ? 'a' : 'b'}`} cx={x} cy={y} r="3.6" />
      })}
    </svg>
  )
}

function Pointer() {
  return (
    <svg className="pointer" viewBox="0 0 40 52" aria-hidden="true">
      <polygon points="20,50 3,5 37,5" fill="#ffd23f" stroke="#0b0a24" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="20" cy="15" r="3.5" fill="#ff3b5c" stroke="#0b0a24" strokeWidth="2" />
    </svg>
  )
}

export default function Wheel({ items, rotation, spinning, onSpinEnd }) {
  const step = 360 / items.length

  return (
    <div className={`wheel-wrap ${spinning ? 'spinning' : ''}`}>
      <Bulbs />

      <div className="wheel" style={{ transform: `rotate(${rotation}deg)` }} onTransitionEnd={onSpinEnd}>
        <svg viewBox={`${-SIZE} ${-SIZE} ${SIZE * 2} ${SIZE * 2}`}>
          {items.map((item, i) => {
            const start = i * step
            const end = start + step
            const { bg, fg } = colorFor(i, items.length)
            const mid = start + step / 2
            const [tx, ty] = polar(mid, SIZE * 0.6)
            const label = `${CATEGORY_EMOJI[item.category] ?? '🍽️'} ${shorten(item.name)}`

            let shape
            if (items.length === 1) {
              shape = <circle r={SIZE} fill={bg} />
            } else {
              const [x1, y1] = polar(start, SIZE)
              const [x2, y2] = polar(end, SIZE)
              const large = step > 180 ? 1 : 0
              shape = (
                <path
                  d={`M0 0 L${x1} ${y1} A${SIZE} ${SIZE} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={bg}
                  stroke="#0b0a24"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              )
            }

            return (
              <g key={item.id}>
                {shape}
                <text
                  x={tx}
                  y={ty}
                  fill={fg}
                  fontSize="7.5"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid - 90} ${tx} ${ty})`}
                >
                  {label}
                </text>
              </g>
            )
          })}
          <circle r={SIZE - 0.8} fill="none" stroke="#0b0a24" strokeWidth="1.6" />
        </svg>
      </div>

      <div className="hub" />
      <Pointer />
    </div>
  )
}
