import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

const baseAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { refreshToken, setTokens } = useAuthStore.getState()
        const response = await baseAxios.post<{
          data: { accessToken: string; refreshToken: string }
        }>('/api/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data
        setTokens(newAccessToken, newRefreshToken)

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)
      } catch {
        const { clearAuth } = useAuthStore.getState()
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export { baseAxios }
export default axiosInstance
