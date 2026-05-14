import axiosInstance from './axiosInstance'
import type {
  LoginRequest,
  SignupRequest,
  AuthUser,
  AuthTokens,
  UpdateProfileRequest,
  DeleteAccountRequest,
} from '../features/auth/types/auth.types'

export async function login(data: LoginRequest): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
  const response = await axiosInstance.post<{ data: { accessToken: string; refreshToken: string; user: AuthUser } }>(
    '/auth/login',
    data
  )
  return response.data.data
}

export async function signup(data: SignupRequest): Promise<AuthUser> {
  const response = await axiosInstance.post<{ data: AuthUser }>('/auth/signup', data)
  return response.data.data
}

export async function logout(refreshToken: string): Promise<void> {
  await axiosInstance.post('/auth/logout', { refreshToken })
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await axiosInstance.post<{ data: AuthTokens }>('/auth/refresh', null, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  })
  return response.data.data
}

export async function getMe(): Promise<AuthUser> {
  const response = await axiosInstance.get<{ data: AuthUser }>('/users/me')
  return response.data.data
}

export async function updateMe(data: UpdateProfileRequest): Promise<AuthUser> {
  const response = await axiosInstance.patch<{ data: AuthUser }>('/users/me', data)
  return response.data.data
}

export async function deleteMe(data: DeleteAccountRequest): Promise<void> {
  await axiosInstance.delete('/users/me', { data })
}
