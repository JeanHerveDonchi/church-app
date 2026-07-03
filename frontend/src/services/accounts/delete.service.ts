import { apiFetch } from '@/lib/api'

export type DeleteAccountPayload = {
  requesterEmail: string
  targetUserId?: string
  targetEmail?: string
}

export type DeleteAccountResponse = {
  success: boolean
  error: string | null
}

export type ManagedDeleteAccountPayload = {
  requesterEmail: string
  targetUserId: string
  targetEmail: string
}

export const deleteAccount = async (
  payload: DeleteAccountPayload,
): Promise<DeleteAccountResponse> => {
  try {
    await apiFetch('/api/accounts/delete', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return { success: true, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// Backend returns French error messages directly.
export const getDeleteErrorMessage = (error: string): string => error
