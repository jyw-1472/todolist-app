import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { useAuthStore } from '../../../store/authStore'
import { login, signup, logout as logoutApi, deleteMe } from '../../../api/auth.api'
import { getErrorMessage } from '../../../utils/errorMessage'
import type { LoginRequest, SignupRequest, DeleteAccountRequest } from '../types/auth.types'
import type { ApiError } from '../../../types/api.types'

function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ error: ApiError }>
  const code = axiosError?.response?.data?.error?.code
  return getErrorMessage(code ?? '')
}

export function useLogin() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const mutation = useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (result) => {
      setTokens(result.accessToken, result.refreshToken)
      setUser(result.user)
      navigate('/')
    },
  })

  return {
    ...mutation,
    errorMessage: mutation.error ? extractErrorMessage(mutation.error) : null,
  }
}

export function useSignup() {
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: (data: SignupRequest) => signup(data),
    onSuccess: () => {
      navigate('/login')
    },
  })

  return {
    ...mutation,
    errorMessage: mutation.error ? extractErrorMessage(mutation.error) : null,
  }
}

export function useLogout() {
  const navigate = useNavigate()
  const { clearAuth, refreshToken } = useAuthStore()

  return useMutation({
    mutationFn: () => logoutApi(refreshToken ?? ''),
    onSettled: () => {
      clearAuth()
      navigate('/login')
    },
  })
}

export function useDeleteAccount() {
  const navigate = useNavigate()
  const { clearAuth } = useAuthStore()

  return useMutation({
    mutationFn: (data: DeleteAccountRequest) => deleteMe(data),
    onSuccess: () => {
      clearAuth()
      navigate('/signup')
    },
  })
}
