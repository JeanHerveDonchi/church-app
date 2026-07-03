import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  resolveAccountLifecycle,
  recreateMissingProfile,
  type LifecycleCheckResult,
  type ProfileData,
} from '@/services/lifecycle.service'
import { resetLocalSession } from '@/features/auth/session'
import { useAuth } from '@/providers/authProvider'

export type UseAuthLifecycleResult = {
  profile: ProfileData | null
  lifecycleState: LifecycleCheckResult | null
  isLoading: boolean
  error: string | null
  canAccess: boolean
  shouldShowRecovery: boolean
  checkAndResolve: () => Promise<void>
}

/**
 * Centralized auth lifecycle hook
 * Manages all account state validation and access control
 *
 * This is the single point of truth for whether a user can access the app
 */
export const useAuthLifecycle = (): UseAuthLifecycleResult => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [lifecycleState, setLifecycleState] = useState<LifecycleCheckResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccessDenied = useCallback(
    async (reason?: 'self_deleted' | 'admin_deleted') => {
      // Clear session and auth state
      await resetLocalSession()

      // Redirect based on deletion type
      if (reason === 'self_deleted') {
        navigate('/recover', { state: { email: user?.email } })
      } else if (reason === 'admin_deleted') {
        navigate('/login', { state: { message: 'Votre compte a été désactivé par un administrateur.' } })
      } else {
        navigate('/login')
      }
    },
    [navigate, user?.email],
  )

  const checkAndResolve = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLifecycleState(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await resolveAccountLifecycle(user.id)
      setLifecycleState(result)

      // Handle missing profile
      if (result.state === 'missing_profile') {
        const email = user.email
        if (email) {
          const recreateResult = await recreateMissingProfile(user.id, email)
          if (recreateResult.success && recreateResult.profile) {
            setProfile(recreateResult.profile)
            const updatedResult = await resolveAccountLifecycle(user.id)
            setLifecycleState(updatedResult)
          } else {
            // Failed to recreate, treat as error
            setError('Impossible de synchroniser votre profil. Veuillez contacter le support.')
            await handleAccessDenied()
          }
        }
        return
      }

      // Handle self-deleted accounts
      if (result.state === 'self_deleted') {
        setProfile(result.profile)
        await handleAccessDenied('self_deleted')
        return
      }

      // Handle admin-deleted accounts
      if (result.state === 'admin_deleted') {
        setProfile(result.profile)
        await handleAccessDenied('admin_deleted')
        return
      }

      // Handle active profile
      if (result.state === 'active' && result.profile) {
        setProfile(result.profile)
        return
      }

      // Unexpected state
      setProfile(result.profile)
      setError('État du compte invalide.')
      await handleAccessDenied()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la vérification du profil'
      setError(errorMsg)
      console.error('Error in checkAndResolve:', err)
      await handleAccessDenied()
    } finally {
      setIsLoading(false)
    }
  }, [user, handleAccessDenied])

  return {
    profile,
    lifecycleState,
    isLoading: authLoading || isLoading,
    error,
    canAccess: lifecycleState?.state === 'active' && !lifecycleState.shouldBlockAccess,
    shouldShowRecovery: lifecycleState?.shouldShowRecovery ?? false,
    checkAndResolve,
  }
}
