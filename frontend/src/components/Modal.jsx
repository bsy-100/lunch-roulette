import { useEffect } from 'react'

// 화면 위에 겹쳐 뜨는 팝업. 바깥 영역 클릭이나 Esc로 닫는다.
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="close" onClick={onClose} aria-label="닫기">
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
