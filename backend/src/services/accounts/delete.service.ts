import type { SupabaseClient } from '@supabase/supabase-js'

export type DeleteAccountPayload = {
  requesterEmail: string
  targetUserId?: string | null
  targetEmail?: string | null
}

export type DeleteAccountResponse = {
  success: boolean
  error: string | null
}

export const deleteAccount = async (
  payload: DeleteAccountPayload,
  client: SupabaseClient,
): Promise<DeleteAccountResponse> => {
  const isManagedDelete =
    typeof payload.targetUserId === 'string' &&
    typeof payload.targetEmail === 'string'

  const { error } = await client.rpc('delete_account', {
    requester_email: payload.requesterEmail.toLowerCase().trim(),
    target_user_id: payload.targetUserId ?? null,
    target_email: isManagedDelete
      ? payload.targetEmail!.toLowerCase().trim()
      : null,
  })

  if (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export const getDeleteErrorMessage = (message: string): string => {
  const errorMap: Record<string, string> = {
    'Authentication required': 'Vous devez être connecté pour supprimer votre compte.',
    'Requester profile not found': "Votre profil n'existe pas.",
    'Deleted accounts cannot perform this action': 'Vous ne pouvez pas effectuer cette action avec un compte supprimé.',
    'Requester email confirmation failed': "L'adresse e-mail ne correspond pas.",
    'Target profile not found': "Le profil cible n'existe pas.",
    'Target account is already deleted': 'Ce compte est déjà supprimé.',
    'Not authorized to delete this account': "Vous n'êtes pas autorisé à supprimer ce compte.",
    'Target email confirmation required': "L'adresse e-mail du compte à supprimer est requise.",
    'Target email confirmation failed': "L'adresse e-mail du compte cible ne correspond pas.",
    'Cannot delete another super admin': 'Vous ne pouvez pas supprimer un autre super-administrateur.',
  }

  return errorMap[message] ?? 'Une erreur est survenue lors de la suppression. Veuillez réessayer.'
}
