import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProfileByEmail, checkAccountLifecycle, type LifecycleCheckResult } from '@/services/lifecycle.service'
import { resetLocalSession } from '@/features/auth/session'

export type UseAuthFlowResult = {
  checkEmailLifecycle: (email: string) => Promise<LifecycleCheckResult | null>
}

/**
 * Hook for checking account lifecycle state during signup/signin flows
 * Used to determine if user should be blocked, offered recovery, or allowed to proceed
 */
export const useAuthFlow = (): UseAuthFlowResult => {
  const navigate = useNavigate()

  const checkEmailLifecycle = useCallback(
    async (email: string): Promise<LifecycleCheckResult | null> => {
      try {
        const profile = await fetchProfileByEmail(email)
        const lifecycle = checkAccountLifecycle(profile)

        // If self-deleted, offer recovery
        if (lifecycle.state === 'self_deleted') {
          await resetLocalSession()
          navigate('/recover', { state: { email } })
          return lifecycle
        }

        // If admin-deleted, block access
        if (lifecycle.state === 'admin_deleted') {
          await resetLocalSession()
          navigate('/login', {
            state: { message: 'Ce compte a été désactivé par un administrateur.' },
          })
          return lifecycle
        }

        return lifecycle
      } catch (err) {
        console.error('Error checking email lifecycle:', err)
        return null
      }
    },
    [navigate],
  )

  return {
    checkEmailLifecycle,
  }
}
