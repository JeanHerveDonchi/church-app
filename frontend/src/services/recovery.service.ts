import { apiFetch } from '@/lib/api'

export type RecoverAccountResponse = {
  success: boolean
  error: string | null
}

export const recoverAccount = async (
  userId: string,
  email: string,
): Promise<RecoverAccountResponse> => {
  try {
    await apiFetch('/api/accounts/recover', {
      method: 'POST',
      body: JSON.stringify({ userId, email }),
    })
    return { success: true, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// Backend returns French error messages directly.
export const getRecoveryErrorMessage = (error: string): string => error
