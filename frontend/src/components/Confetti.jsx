import { useState } from 'react'

const COLORS = ['#ff3b5c', '#ffd23f', '#2ec4b6', '#7b5cff', '#ff8c42', '#ffffff']

function makePieces() {
  return Array.from({ length: 40 }, (_, id) => ({
    id,
    color: COLORS[id % COLORS.length],
    x: (Math.random() - 0.5) * 460,
    y: 110 + Math.random() * 200,
    r: (Math.random() - 0.5) * 720,
    delay: Math.random() * 0.15,
  }))
}

// 당첨 순간에 한 번 터지는 색종이. 나타날 때마다 새로 만들어지도록 key를 바꿔서 쓴다.
export default function Confetti() {
  const [pieces] = useState(makePieces)

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="piece"
          style={{
            '--c': p.color,
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--r': `${p.r}deg`,
            '--d': `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
