import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '../../../components/Input'
import { Button } from '../../../components/Button'
import { ErrorMessage } from '../../../components/ErrorMessage'
import { useLogin } from '../hooks/useAuth'

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'demo@example.com'
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'demo1234'

interface LoginFormProps {
  demoMode?: boolean
}

export function LoginForm({ demoMode = false }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const { mutate: loginMutate, isPending, errorMessage } = useLogin()
  const navigate = useNavigate()

  useEffect(() => {
    if (demoMode) {
      setEmail(DEMO_EMAIL)
      setPassword(DEMO_PASSWORD)
    }
  }, [demoMode])

  function fillDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setFieldErrors({})
    navigate('/login?demo=true', { replace: true })
  }

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
      {demoMode && (
        <div className="demo-notice">
          데모용 계정이 입력되어 있습니다. 로그인 버튼을 눌러 서비스를 체험해 보세요.
        </div>
      )}
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
      {!demoMode && (
        <Button type="button" variant="secondary" onClick={fillDemo} style={{ width: '100%' }}>
          데모 계정으로 체험하기
        </Button>
      )}
      <p className="auth-switch">
        계정이 없으신가요?{' '}
        <Link to="/signup">
          회원가입
        </Link>
      </p>
    </form>
  )
}
