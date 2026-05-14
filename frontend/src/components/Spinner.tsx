interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 14, md: 20, lg: 32 }

export function Spinner({ size = 'md' }: SpinnerProps) {
  const px = sizeMap[size]
  return (
    <span
      role="status"
      aria-label="로딩 중"
      style={{
        display: 'inline-block',
        width: px,
        height: px,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}
