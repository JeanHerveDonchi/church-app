import type { SupabaseClient } from '@supabase/supabase-js'

export type RecoverAccountResponse = {
  success: boolean
  error: string | null
}

export const recoverAccount = async (
  userId: string,
  email: string,
  client: SupabaseClient,
): Promise<RecoverAccountResponse> => {
  const { error } = await client.rpc('recover_account', {
    user_id: userId,
    user_email: email,
  })

  if (error) {
    console.error('Error recovering account:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export const getRecoveryErrorMessage = (message: string): string => {
  const errorMap: Record<string, string> = {
    'Account is not self-deleted': 'Ce compte ne peut pas être restauré. Il a été supprimé par un administrateur.',
    'Not authorized to recover this account': 'Vous ne pouvez restaurer que votre propre compte.',
    'Email confirmation failed': "L'adresse e-mail ne correspond pas.",
    'Profile not found': "Le profil n'existe pas.",
    'Authentication required': 'Vous devez être connecté pour restaurer votre compte.',
  }

  return errorMap[message] ?? 'Une erreur est survenue lors de la restauration. Veuillez réessayer.'
}
