import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import axiosInstance from '../api/axiosInstance'
import { login, signup, logout, refreshAccessToken, getMe, updateMe, deleteMe } from '../api/auth.api'
import { useAuthStore } from '../store/authStore'

const mock = new MockAdapter(axiosInstance)

beforeEach(() => {
  mock.reset()
  useAuthStore.getState().clearAuth()
})

afterEach(() => {
  mock.reset()
})

const mockUser = {
  user_id: 1,
  email: 'user@example.com',
  name: '홍길동',
  provider: 'local',
  created_at: '2026-05-14T09:00:00.000Z',
}

describe('login', () => {
  it('성공 시 accessToken, refreshToken, user를 반환한다', async () => {
    mock.onPost('/auth/login').reply(200, {
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      },
    })

    const result = await login({ email: 'user@example.com', password: 'Password123!' })

    expect(result.accessToken).toBe('access-token')
    expect(result.refreshToken).toBe('refresh-token')
    expect(result.user).toEqual(mockUser)
  })

  it('401 에러 시 reject된다', async () => {
    mock.onPost('/auth/login').reply(401, {
      error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
    })

    await expect(login({ email: 'user@example.com', password: 'wrong' })).rejects.toMatchObject({
      response: { status: 401 },
    })
  })

  it('400 에러 시 reject된다', async () => {
    mock.onPost('/auth/login').reply(400, {
      error: { code: 'VALIDATION_ERROR', message: '필수 필드가 누락되었습니다.' },
    })

    await expect(login({ email: '', password: '' })).rejects.toMatchObject({
      response: { status: 400 },
    })
  })
})

describe('signup', () => {
  it('성공 시 AuthUser를 반환한다', async () => {
    mock.onPost('/auth/signup').reply(201, { data: mockUser })

    const result = await signup({ email: 'user@example.com', password: 'Password123!', name: '홍길동' })

    expect(result).toEqual(mockUser)
  })

  it('409 이메일 중복 시 reject된다', async () => {
    mock.onPost('/auth/signup').reply(409, {
      error: { code: 'DUPLICATE_EMAIL', message: '이미 사용 중인 이메일입니다.' },
    })

    await expect(
      signup({ email: 'user@example.com', password: 'Password123!', name: '홍길동' })
    ).rejects.toMatchObject({ response: { status: 409 } })
  })
})

describe('logout', () => {
  it('성공 시 resolve된다', async () => {
    mock.onPost('/auth/logout').reply(200, { data: null })

    await expect(logout('refresh-token')).resolves.toBeUndefined()
  })

  it('refreshToken을 바디에 담아 전송한다', async () => {
    let capturedBody: unknown
    mock.onPost('/auth/logout').reply((config) => {
      capturedBody = JSON.parse(config.data as string)
      return [200, { data: null }]
    })

    await logout('my-refresh-token')

    expect(capturedBody).toEqual({ refreshToken: 'my-refresh-token' })
  })
})

describe('refreshAccessToken', () => {
  it('성공 시 새 AccessToken과 RefreshToken을 반환한다', async () => {
    mock.onPost('/auth/refresh').reply(200, {
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    })

    const result = await refreshAccessToken('old-refresh-token')

    expect(result.accessToken).toBe('new-access')
    expect(result.refreshToken).toBe('new-refresh')
  })

  it('401 에러 시 reject된다', async () => {
    mock.onPost('/auth/refresh').reply(401, {
      error: { code: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' },
    })

    await expect(refreshAccessToken('invalid-token')).rejects.toMatchObject({
      response: { status: 401 },
    })
  })
})

describe('getMe', () => {
  it('성공 시 AuthUser를 반환한다', async () => {
    mock.onGet('/users/me').reply(200, { data: mockUser })

    const result = await getMe()

    expect(result).toEqual(mockUser)
  })

  it('401 에러 시 reject된다', async () => {
    mock.onGet('/users/me').reply(401, {
      error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
    })

    await expect(getMe()).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe('updateMe', () => {
  it('이름 수정 성공 시 수정된 AuthUser를 반환한다', async () => {
    const updatedUser = { ...mockUser, name: '새이름' }
    mock.onPatch('/users/me').reply(200, { data: updatedUser })

    const result = await updateMe({ name: '새이름' })

    expect(result.name).toBe('새이름')
    expect(result).toEqual(updatedUser)
  })

  it('비밀번호 변경 성공 시 수정된 AuthUser를 반환한다', async () => {
    mock.onPatch('/users/me').reply(200, { data: mockUser })

    const result = await updateMe({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
    })

    expect(result).toEqual(mockUser)
  })

  it('현재 비밀번호 불일치 시 reject된다', async () => {
    mock.onPatch('/users/me').reply(401, {
      error: { code: 'UNAUTHORIZED', message: '현재 비밀번호가 올바르지 않습니다.' },
    })

    await expect(
      updateMe({ currentPassword: 'WrongPass1!', newPassword: 'NewPass1!' })
    ).rejects.toMatchObject({ response: { status: 401 } })
  })
})

describe('deleteMe', () => {
  it('성공 시 resolve된다 (204)', async () => {
    mock.onDelete('/users/me').reply(204)

    await expect(deleteMe({ password: 'Password123!' })).resolves.toBeUndefined()
  })

  it('비밀번호 불일치 시 reject된다', async () => {
    mock.onDelete('/users/me').reply(401, {
      error: { code: 'UNAUTHORIZED', message: '비밀번호가 올바르지 않습니다.' },
    })

    await expect(deleteMe({ password: 'wrong' })).rejects.toMatchObject({
      response: { status: 401 },
    })
  })
})
