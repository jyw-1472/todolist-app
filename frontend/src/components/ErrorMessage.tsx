interface ErrorMessageProps {
  message: string | null
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null
  return (
    <p
      role="alert"
      style={{
        fontSize: '13px',
        color: '#d50000',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      ⚠ {message}
    </p>
  )
}
