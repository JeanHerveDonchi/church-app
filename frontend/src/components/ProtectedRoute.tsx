import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthLifecycle } from '@/hooks/useAuthLifecycle'
import { useAuth } from '@/providers/authProvider'

export type ProtectedRouteProps = {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * ProtectedRoute component
 * Wraps pages that require active user access
 *
 * Handles:
 * - Redirect unauthenticated users to login
 * - Block deleted users (self-deleted and admin-deleted)
 * - Auto-recover missing profiles
 * - Show loading state during validation
 */
export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { canAccess, isLoading, checkAndResolve } = useAuthLifecycle()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login')
      } else {
        void checkAndResolve()
      }
    }
  }, [user, authLoading, checkAndResolve, navigate])

  if (authLoading || isLoading) {
    return fallback ?? <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  if (!canAccess) {
    return null // Redirected by lifecycle check
  }

  return <>{children}</>
}
