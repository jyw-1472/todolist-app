import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, style, ...rest }: InputProps) {
  const inputId = id ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="form-field">
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <input
        id={inputId}
        className="text-input"
        style={{
          borderColor: error ? 'var(--color-danger)' : undefined,
          ...style,
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <span
          id={`${inputId}-error`}
          role="alert"
          style={{ fontSize: '12px', color: 'var(--color-danger)' }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
