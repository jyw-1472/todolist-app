import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../../components/Input'
import { Button } from '../../../components/Button'
import { ErrorMessage } from '../../../components/ErrorMessage'
import { useLogin } from '../hooks/useAuth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const { mutate: loginMutate, isPending, errorMessage } = useLogin()

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = '이메일을 입력해주세요.'
    if (!password) errors.password = '비밀번호를 입력해주세요.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    loginMutate({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form">
      <Input
        label="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Input
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        placeholder="비밀번호 입력"
        autoComplete="current-password"
      />
      <ErrorMessage message={errorMessage} />
      <Button type="submit" isLoading={isPending} style={{ width: '100%' }}>
        로그인
      </Button>
      <p className="auth-switch">
        계정이 없으신가요?{' '}
        <Link to="/signup">
          회원가입
        </Link>
      </p>
    </form>
  )
}
