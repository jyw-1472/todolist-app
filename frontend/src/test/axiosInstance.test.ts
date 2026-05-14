import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import axiosInstance, { baseAxios } from '../api/axiosInstance'
import { useAuthStore } from '../store/authStore'

const mockMain = new MockAdapter(axiosInstance)
const mockBase = new MockAdapter(baseAxios)

beforeEach(() => {
  mockMain.reset()
  mockBase.reset()
  useAuthStore.getState().clearAuth()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('axiosInstance 기본 설정', () => {
  it('요청 인터셉터가 등록되어 있다', () => {
    expect(axiosInstance.interceptors.request).toBeDefined()
  })

  it('응답 인터셉터가 등록되어 있다', () => {
    expect(axiosInstance.interceptors.response).toBeDefined()
  })
})

describe('요청 인터셉터 — Authorization 헤더 주입', () => {
  it('accessToken이 없으면 Authorization 헤더를 주입하지 않는다', async () => {
    mockMain.onGet('/api/test').reply(200, { ok: true })

    const response = await axiosInstance.get('/api/test')

    expect(response.config.headers?.['Authorization']).toBeUndefined()
  })

  it('accessToken이 있으면 Authorization: Bearer 헤더를 주입한다', async () => {
    useAuthStore.getState().setTokens('access-token-123', 'refresh-token-123')
    mockMain.onGet('/api/test').reply(200, { ok: true })

    const response = await axiosInstance.get('/api/test')

    expect(response.config.headers?.['Authorization']).toBe('Bearer access-token-123')
  })
})

describe('응답 인터셉터 — 401 처리', () => {
  it('401이 아닌 에러는 그대로 reject한다', async () => {
    mockMain.onGet('/api/test').reply(500)

    await expect(axiosInstance.get('/api/test')).rejects.toMatchObject({
      response: { status: 500 },
    })
  })

  it('401 응답 시 POST /api/auth/refresh를 호출하고 새 토큰을 저장한다', async () => {
    useAuthStore.getState().setTokens('expired-token', 'valid-refresh')

    mockMain.onGet('/api/todos').replyOnce(401).onGet('/api/todos').reply(200, { data: [] })
    mockBase.onPost('/api/auth/refresh').reply(200, {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })

    await axiosInstance.get('/api/todos')

    expect(useAuthStore.getState().accessToken).toBe('new-access-token')
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token')
  })

  it('refresh 성공 후 원래 요청을 재시도하여 성공 응답을 반환한다', async () => {
    useAuthStore.getState().setTokens('expired-token', 'valid-refresh')

    mockMain.onGet('/api/todos').replyOnce(401).onGet('/api/todos').reply(200, { data: [1, 2] })
    mockBase.onPost('/api/auth/refresh').reply(200, {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })

    const response = await axiosInstance.get('/api/todos')

    expect(response.status).toBe(200)
    expect(response.data).toEqual({ data: [1, 2] })
  })

  it('refresh 실패 시 clearAuth를 호출하여 토큰을 초기화한다', async () => {
    useAuthStore.getState().setTokens('expired-token', 'expired-refresh')

    mockMain.onGet('/api/todos').reply(401)
    mockBase.onPost('/api/auth/refresh').reply(401)

    await expect(axiosInstance.get('/api/todos')).rejects.toBeDefined()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().refreshToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('refresh 실패 시 /login으로 이동한다', async () => {
    useAuthStore.getState().setTokens('expired-token', 'expired-refresh')

    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/' },
      writable: true,
    })

    mockMain.onGet('/api/todos').reply(401)
    mockBase.onPost('/api/auth/refresh').reply(401)

    await expect(axiosInstance.get('/api/todos')).rejects.toBeDefined()

    expect(window.location.href).toBe('/login')
  })
})
