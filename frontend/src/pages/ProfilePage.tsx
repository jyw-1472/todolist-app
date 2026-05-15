import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Modal } from '../components/Modal'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { useGetMe } from '../features/auth/hooks/useProfile'
import { useLogout, useDeleteAccount } from '../features/auth/hooks/useAuth'
import { getErrorMessage } from '../utils/errorMessage'
import { useAuthStore } from '../store/authStore'
import { updateMe } from '../api/auth.api'
import type { ApiError } from '../types/api.types'

function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ error: ApiError }>
  const code = axiosError?.response?.data?.error?.code
  return getErrorMessage(code ?? '')
}

export function ProfilePage() {
  const { data: meData } = useGetMe()
  const { mutate: logout } = useLogout()
  const { setUser } = useAuthStore()
  const deleteAccount = useDeleteAccount()
  const queryClient = useQueryClient()

  const nameUpdateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const passwordUpdateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => setUser(user),
  })

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (meData?.name) setName(meData.name)
  }, [meData?.name])

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === meData?.name) {
      setNameError('변경할 이름을 입력해주세요.')
      return
    }
    setNameError(null)
    setNameSuccess(false)
    nameUpdateMutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => setNameSuccess(true),
        onError: (error) => setNameError(extractErrorMessage(error)),
      }
    )
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) {
      setPasswordError('현재 비밀번호를 입력해주세요.')
      return
    }
    if (!newPassword) {
      setPasswordError('새 비밀번호를 입력해주세요.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setPasswordError(null)
    setPasswordSuccess(false)
    passwordUpdateMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess(true)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        },
        onError: (error) => {
          const axiosError = error as AxiosError<{ error: ApiError }>
          const code = axiosError?.response?.data?.error?.code
          setPasswordError(code === 'UNAUTHORIZED' ? '현재 비밀번호가 올바르지 않습니다.' : extractErrorMessage(error))
        },
      }
    )
  }

  function handleDeleteSubmit() {
    if (!deletePassword) {
      setDeletePasswordError('비밀번호를 입력해주세요.')
      return
    }
    setDeletePasswordError(null)
    deleteAccount.mutate(
      { password: deletePassword },
      {
        onError: (error) => {
          const axiosError = error as AxiosError<{ error: ApiError }>
          const code = axiosError?.response?.data?.error?.code
          setDeletePasswordError(code === 'UNAUTHORIZED' ? '비밀번호가 올바르지 않습니다.' : extractErrorMessage(error))
        },
      }
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <span className="brand-title">TodoList</span>
            <span className="brand-subtitle">계정 정보와 보안 설정을 관리합니다.</span>
          </div>
          <Button variant="secondary" onClick={() => logout()}>
            로그아웃
          </Button>
        </div>
      </header>

      <main className="page-container">
        <section className="page-hero">
          <div>
            <p className="section-kicker">Account</p>
            <h1 className="page-title">프로필</h1>
            <p className="page-description">
              이름, 비밀번호, 계정 삭제 같은 민감한 설정을 한 곳에서 관리합니다.
            </p>
          </div>
          <article className="summary-card" style={{ minWidth: '280px', minHeight: '104px' }}>
            <span className="summary-label">현재 계정</span>
            <strong className="summary-value" style={{ fontSize: '20px', lineHeight: 1.25 }}>
              {meData?.name ?? (name || '사용자')}
            </strong>
            <span className="summary-meta">{meData?.email ?? '이메일 정보를 불러오는 중'}</span>
          </article>
        </section>

        <div className="settings-grid">
          <section className="settings-card">
            <div className="panel-header">
              <div>
                <p className="section-kicker">Identity</p>
                <h2 className="panel-title">이름 변경</h2>
                <p className="panel-subtitle">앱에서 표시되는 사용자 이름을 업데이트합니다.</p>
              </div>
            </div>
            <form onSubmit={handleNameSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="현재 이름"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(null)
                  setNameSuccess(false)
                }}
                error={nameError ?? undefined}
              />
              {nameSuccess && <p className="success-text">이름이 변경되었습니다.</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" isLoading={nameUpdateMutation.isPending}>
                  이름 변경
                </Button>
              </div>
            </form>
          </section>

          <div className="settings-stack">
            <section className="settings-card">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Security</p>
                  <h2 className="panel-title">비밀번호 변경</h2>
                  <p className="panel-subtitle">계정 보호를 위해 주기적으로 비밀번호를 변경하세요.</p>
                </div>
              </div>
              <form onSubmit={handlePasswordSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input
                  label="현재 비밀번호"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setPasswordError(null)
                  }}
                />
                <Input
                  label="새 비밀번호"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError(null)
                  }}
                />
                <Input
                  label="새 비밀번호 확인"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError(null)
                  }}
                  error={passwordError ?? undefined}
                />
                {passwordSuccess && <p className="success-text">비밀번호가 변경되었습니다.</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" isLoading={passwordUpdateMutation.isPending}>
                    비밀번호 변경
                  </Button>
                </div>
              </form>
            </section>

            <section className="settings-card" style={{ borderColor: 'color-mix(in srgb, var(--color-danger) 40%, var(--color-border))' }}>
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Danger zone</p>
                  <h2 className="panel-title">계정 관리</h2>
                  <p className="panel-subtitle">계정 삭제는 모든 할일과 카테고리를 함께 삭제합니다.</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="danger" onClick={() => setDeleteModal(true)}>
                  회원 탈퇴
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {[
            { to: '/', label: '일정 캘린더' },
            { to: '/categories', label: '카테고리' },
            { to: '/profile', label: '프로필' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className={`nav-link ${to === '/profile' ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <Modal
        isOpen={deleteModal}
        onClose={() => {
          setDeleteModal(false)
          setDeletePassword('')
          setDeletePasswordError(null)
        }}
        title="회원 탈퇴"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p className="danger-text">정말 탈퇴하시겠습니까?</p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            모든 데이터가 즉시 삭제되며 복구할 수 없습니다. 계속하려면 현재 비밀번호를 입력해주세요.
          </p>
          <Input
            id="delete-password"
            label="현재 비밀번호"
            type="password"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value)
              setDeletePasswordError(null)
            }}
            error={deletePasswordError ?? undefined}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModal(false)
                setDeletePassword('')
                setDeletePasswordError(null)
              }}
              disabled={deleteAccount.isPending}
            >
              취소
            </Button>
            <Button
              variant="danger"
              isLoading={deleteAccount.isPending}
              onClick={handleDeleteSubmit}
            >
              탈퇴하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
