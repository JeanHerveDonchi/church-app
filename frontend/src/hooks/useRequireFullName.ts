import { useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  normalizeFullName,
  PROFILE_FIELDS,
  type ProfileRecord,
  validateRequiredFullName,
} from '@/features/profile/profile'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/authProvider'

type RequireFullNameOptions = {
  confirmText?: string
  description?: string
  onContinue: (profile: ProfileRecord | null) => void | Promise<void>
  title: string
}

type DialogState = {
  confirmText: string
  description?: string
  title: string
}

const getProfileQueryKey = (userId: string | null) =>
  ['profile', 'me', userId] as const

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }
  return fallbackMessage
}

// Fetches the current user's profile via the backend API (JWT-authenticated)
const fetchCurrentProfile = async (): Promise<ProfileRecord | null> => {
  return apiFetch<ProfileRecord | null>('/api/profiles/me')
}

export const useRequireFullName = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogState, setDialogState] = useState<DialogState | null>(null)
  const [draft, setDraft] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const pendingActionRef =
    useRef<RequireFullNameOptions['onContinue'] | null>(null)

  const { data: profile, error, isLoading } = useQuery({
    queryKey: getProfileQueryKey(user?.id ?? null),
    queryFn: () => fetchCurrentProfile(),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  })

  const validationError = validateRequiredFullName(draft)
  const inputError = validationError ?? saveError
  const hasFullName = normalizeFullName(profile?.full_name ?? '') !== null

  const loadLatestProfile = useCallback(async () => {
    if (!user) return null
    return queryClient.fetchQuery({
      queryKey: getProfileQueryKey(user.id),
      queryFn: () => fetchCurrentProfile(),
    })
  }, [queryClient, user])

  const closeDialog = useCallback(() => {
    if (isSaving) return
    pendingActionRef.current = null
    setDialogState(null)
    setDraft(profile?.full_name ?? '')
    setSaveError(null)
  }, [isSaving, profile?.full_name])

  const requireFullName = useCallback(
    async ({
      confirmText = 'Ajouter mon nom',
      description,
      onContinue,
      title,
    }: RequireFullNameOptions) => {
      if (!user) return false

      let latestProfile: ProfileRecord | null = null

      try {
        latestProfile = await loadLatestProfile()
      } catch (profileError) {
        console.error('Error loading current profile:', profileError)
      }

      if (normalizeFullName(latestProfile?.full_name ?? '') !== null) {
        await onContinue(latestProfile)
        return true
      }

      pendingActionRef.current = onContinue
      setDialogState({ confirmText, description, title })
      setDraft(latestProfile?.full_name ?? '')
      setSaveError(null)

      return false
    },
    [loadLatestProfile, user],
  )

  const handleConfirm = useCallback(async () => {
    if (!user || !dialogState) return

    const nextValidationError = validateRequiredFullName(draft)
    if (nextValidationError) {
      setSaveError(null)
      return
    }

    setIsSaving(true)

    try {
      // Update full_name via backend API — keeps Supabase credentials server-side
      let nextProfile: ProfileRecord
      try {
        nextProfile = await apiFetch<ProfileRecord>('/api/profiles/me', {
          method: 'PUT',
          body: JSON.stringify({ full_name: normalizeFullName(draft) }),
        })
      } catch (err) {
        setSaveError(
          getErrorMessage(err, 'Impossible de mettre a jour votre nom complet.'),
        )
        return
      }

      const pendingAction = pendingActionRef.current

      queryClient.setQueryData(getProfileQueryKey(user.id), nextProfile)
      pendingActionRef.current = null
      setDialogState(null)
      setDraft(nextProfile.full_name ?? '')
      setSaveError(null)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['comments'] }),
      ])

      if (pendingAction) {
        await pendingAction(nextProfile)
      }
    } finally {
      setIsSaving(false)
    }
  }, [dialogState, draft, queryClient, user])

  return {
    dialogProps: dialogState
      ? {
          confirmDisabled: Boolean(validationError),
          confirmText: dialogState.confirmText,
          description: dialogState.description,
          inputError,
          inputLabel: 'Nom complet',
          inputMaxLength: 100,
          inputPlaceholder: 'Votre nom complet',
          inputValue: draft,
          loading: isSaving,
          onCancel: closeDialog,
          onConfirm: handleConfirm,
          onInputChange: (value: string) => {
            setDraft(value)
            setSaveError(null)
          },
          open: true,
          title: dialogState.title,
        }
      : {
          confirmDisabled: false,
          confirmText: '',
          inputError: null,
          inputLabel: 'Nom complet',
          inputMaxLength: 100,
          inputPlaceholder: 'Votre nom complet',
          inputValue: '',
          loading: false,
          onCancel: closeDialog,
          onConfirm: handleConfirm,
          onInputChange: () => {},
          open: false,
          title: '',
        },
    hasFullName,
    profile: profile ?? null,
    profileError: error,
    profileLoading: isLoading,
    requireFullName,
  }
}
