import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken)
  if (accessToken) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
