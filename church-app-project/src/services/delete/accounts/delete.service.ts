import { normalizeEmail } from '@/features/auth/auth'
import { supabase } from '@/providers/supabaseClient'

type SelfDeleteAccountPayload = {
  requesterEmail: string
  targetEmail?: never
  targetUserId?: never
}

type ManagedDeleteAccountPayload = {
  requesterEmail: string
  targetEmail: string
  targetUserId: string
}

export type DeleteAccountPayload =
  | SelfDeleteAccountPayload
  | ManagedDeleteAccountPayload

const isManagedDeleteAccountPayload = (
  payload: DeleteAccountPayload,
): payload is ManagedDeleteAccountPayload =>
  typeof payload.targetUserId === 'string' &&
  typeof payload.targetEmail === 'string'

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message

    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim().toLowerCase()
    }
  }

  return null
}

const mapDeleteAccountError = (
  error: unknown,
  mode: 'self' | 'managed',
) => {
  const message = getErrorMessage(error)

  if (!message) {
    return mode === 'self'
      ? 'Impossible de supprimer votre compte pour le moment.'
      : 'Impossible de supprimer ce compte pour le moment.'
  }

  if (
    message.includes('authentication required') ||
    message.includes('jwt') ||
    message.includes('session')
  ) {
    return 'Votre session a expire. Reconnectez-vous.'
  }

  if (
    message.includes('requester profile not found') ||
    message.includes('deleted accounts cannot perform this action')
  ) {
    return "Cette action n'est plus disponible."
  }

  if (message.includes('requester email confirmation failed')) {
    return 'Cette adresse ne correspond pas.'
  }

  if (message.includes('target profile not found')) {
    return 'Ce compte est introuvable.'
  }

  if (message.includes('target account already deleted')) {
    return 'Ce compte a deja ete supprime.'
  }

  if (message.includes('not authorized')) {
    return "Vous n'avez pas acces a cette action."
  }

  if (
    message.includes('target email confirmation required') ||
    message.includes('target email confirmation failed')
  ) {
    return "L'adresse du compte ne correspond pas."
  }

  if (message.includes('cannot delete another super admin')) {
    return 'Ce compte ne peut pas etre supprime.'
  }

  return mode === 'self'
    ? 'Impossible de supprimer votre compte pour le moment.'
    : 'Impossible de supprimer ce compte pour le moment.'
}

export async function deleteAccount(payload: DeleteAccountPayload): Promise<void> {
  const isManagedDelete = isManagedDeleteAccountPayload(payload)

  const { error } = await supabase.rpc('delete_account', {
    requester_email: normalizeEmail(payload.requesterEmail),
    target_email: isManagedDelete ? normalizeEmail(payload.targetEmail) : null,
    target_user_id: payload.targetUserId ?? null,
  })

  if (error) {
    throw new Error(
      mapDeleteAccountError(
        error,
        isManagedDelete ? 'managed' : 'self',
      ),
    )
  }
}
