import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import type { AuthUser } from '../types/auth.types'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('초기 상태가 모두 null이다', () => {
    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
  })

  it('setTokens()가 accessToken과 refreshToken을 저장한다', () => {
    useAuthStore.getState().setTokens('access-abc', 'refresh-xyz')
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access-abc')
    expect(state.refreshToken).toBe('refresh-xyz')
  })

  it('setUser()가 user를 저장한다', () => {
    const user: AuthUser = { userId: 1, email: 'test@example.com', name: '홍길동' }
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('clearAuth()가 모든 상태를 null로 초기화한다', () => {
    useAuthStore.getState().setTokens('access', 'refresh')
    useAuthStore.getState().setUser({ userId: 1, email: 'a@b.com', name: '테스터' })

    useAuthStore.getState().clearAuth()

    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
  })

  it('persist 미들웨어를 사용하지 않는다 (localStorage에 저장되지 않는다)', () => {
    useAuthStore.getState().setTokens('access', 'refresh')
    const localStorageKeys = Object.keys(localStorage)
    expect(localStorageKeys.some((key) => key.includes('auth'))).toBe(false)
  })
})

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ isModalOpen: false, toasts: [] })
  })

  it('초기 상태: isModalOpen이 false이고 toasts가 빈 배열이다', () => {
    const state = useUiStore.getState()
    expect(state.isModalOpen).toBe(false)
    expect(state.toasts).toEqual([])
  })

  it('openModal()이 isModalOpen을 true로 설정한다', () => {
    useUiStore.getState().openModal()
    expect(useUiStore.getState().isModalOpen).toBe(true)
  })

  it('closeModal()이 isModalOpen을 false로 설정한다', () => {
    useUiStore.getState().openModal()
    useUiStore.getState().closeModal()
    expect(useUiStore.getState().isModalOpen).toBe(false)
  })

  it('addToast()가 토스트를 큐에 추가한다', () => {
    useUiStore.getState().addToast({ message: '저장되었습니다.', type: 'success' })
    const { toasts } = useUiStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('저장되었습니다.')
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].id).toBeDefined()
  })

  it('addToast()가 여러 토스트를 순서대로 추가한다', () => {
    useUiStore.getState().addToast({ message: '첫 번째', type: 'info' })
    useUiStore.getState().addToast({ message: '두 번째', type: 'error' })
    const { toasts } = useUiStore.getState()
    expect(toasts).toHaveLength(2)
    expect(toasts[0].message).toBe('첫 번째')
    expect(toasts[1].message).toBe('두 번째')
  })

  it('removeToast()가 해당 id의 토스트만 제거한다', () => {
    useUiStore.getState().addToast({ message: '첫 번째', type: 'success' })
    useUiStore.getState().addToast({ message: '두 번째', type: 'error' })

    const { toasts } = useUiStore.getState()
    const firstId = toasts[0].id

    useUiStore.getState().removeToast(firstId)

    const remaining = useUiStore.getState().toasts
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('두 번째')
  })

  it('각 토스트의 id가 고유하다', () => {
    useUiStore.getState().addToast({ message: 'A', type: 'info' })
    useUiStore.getState().addToast({ message: 'B', type: 'info' })
    const { toasts } = useUiStore.getState()
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })
})
