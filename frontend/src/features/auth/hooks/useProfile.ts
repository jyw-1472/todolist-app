import { useQuery, useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { getMe, updateMe } from '../../../api/auth.api'
import { useAuthStore } from '../../../store/authStore'
import { getErrorMessage } from '../../../utils/errorMessage'
import type { UpdateProfileRequest } from '../types/auth.types'
import type { ApiError } from '../../../types/api.types'

function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ error: ApiError }>
  const code = axiosError?.response?.data?.error?.code
  return getErrorMessage(code ?? '')
}

export function useGetMe() {
  return useQuery({ queryKey: ['me'], queryFn: getMe })
}

export function useUpdateMe() {
  const { setUser } = useAuthStore()

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateMe(data),
    onSuccess: (user) => setUser(user),
  })

  return {
    ...mutation,
    errorMessage: mutation.error ? extractErrorMessage(mutation.error) : null,
  }
}
