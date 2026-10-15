// 상세 정보의 "항목 | 값" 한 줄
export default function Row({ label, children }) {
  return (
    <div className="detail-row">
      <span className="k">{label}</span>
      <span>{children}</span>
    </div>
  )
}
