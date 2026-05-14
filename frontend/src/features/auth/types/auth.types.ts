export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface AuthUser {
  user_id: number
  email: string
  name: string
  provider: string
  created_at: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UpdateProfileRequest {
  name?: string
  currentPassword?: string
  newPassword?: string
}

export interface DeleteAccountRequest {
  password: string
}
