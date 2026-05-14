interface BadgeProps {
  isCompleted: boolean
}

export function Badge({ isCompleted }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: isCompleted ? '#e6f4ea' : '#f1f3f4',
        color: isCompleted ? '#1e8e3e' : '#5f6368',
      }}
    >
      {isCompleted ? '완료' : '미완료'}
    </span>
  )
}
