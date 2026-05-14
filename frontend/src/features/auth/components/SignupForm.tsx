import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../../components/Input'
import { Button } from '../../../components/Button'
import { ErrorMessage } from '../../../components/ErrorMessage'
import { useSignup } from '../hooks/useAuth'

export function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const { mutate: signupMutate, isPending, errorMessage } = useSignup()

  function validate(): boolean {
    const errors: { name?: string; email?: string; password?: string } = {}
    if (!name.trim()) errors.name = '이름을 입력해주세요.'
    if (!email.trim()) errors.email = '이메일을 입력해주세요.'
    if (!password) errors.password = '비밀번호를 입력해주세요.'
    else if (password.length < 8) errors.password = '비밀번호는 8자 이상이어야 합니다.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    signupMutate({ name, email, password })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form">
      <Input
        label="이름"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
        placeholder="홍길동"
        autoComplete="name"
      />
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
        placeholder="8자 이상"
        autoComplete="new-password"
      />
      <ErrorMessage message={errorMessage} />
      <Button type="submit" isLoading={isPending} style={{ width: '100%' }}>
        가입하기
      </Button>
      <p className="auth-switch">
        이미 계정이 있으신가요?{' '}
        <Link to="/login">
          로그인
        </Link>
      </p>
    </form>
  )
}
