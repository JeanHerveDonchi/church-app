import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  dispatchProfileAvatarUpdated,
  type AvatarName,
  type ProfileRecord,
  PROFILE_FIELDS,
  isKnownAvatar,
  normalizeFullName,
  pickRandomAvatar,
  validateFullName,
} from '../features/profile/profile'
import { useAuth } from '../providers/authProvider'
import { supabase } from '../providers/supabaseClient'

type MutationResult = {
  message: string
  ok: boolean
}

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message

    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return fallbackMessage
}

const toPostCount = (value: unknown) => {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : 0

  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0
}

export const useMyProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [postCount, setPostCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const activeRequestIdRef = useRef(0)

  const assignRandomAvatar = useCallback(
    async (userId: string): Promise<ProfileRecord> => {
      const avatar = pickRandomAvatar()
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatar })
        .eq('id', userId)
        .select(PROFILE_FIELDS)
        .single()

      if (updateError) {
        throw updateError
      }

      dispatchProfileAvatarUpdated(data.avatar_url)

      return data as ProfileRecord
    },
    [],
  )

  const fetchProfile = useEffectEvent(async (nextUser: typeof user) => {
    if (!nextUser) {
      setProfile(null)
      setPostCount(0)
      setError(null)
      setLoading(false)
      return
    }

    const requestId = ++activeRequestIdRef.current
    setLoading(true)
    setError(null)

    const [profileResult, postCountResult] = await Promise.all([
      supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', nextUser.id)
        .maybeSingle(),
      supabase.rpc('get_my_post_count'),
    ])

    if (requestId !== activeRequestIdRef.current) {
      return
    }

    if (profileResult.error) {
      console.error('Error loading profile:', profileResult.error)
      setError('Impossible de charger votre profil pour le moment.')
      setLoading(false)
      return
    }

    if (!profileResult.data) {
      setError('Votre profil est introuvable.')
      setLoading(false)
      return
    }

    let nextProfile = profileResult.data as ProfileRecord

    if (!nextProfile.avatar_url) {
      try {
        nextProfile = await assignRandomAvatar(nextUser.id)
      } catch (assignmentError) {
        console.error('Error assigning avatar:', assignmentError)
      }

      if (requestId !== activeRequestIdRef.current) {
        return
      }
    }

    if (postCountResult.error) {
      console.error('Error loading post count:', postCountResult.error)
      setPostCount(0)
    } else {
      setPostCount(toPostCount(postCountResult.data))
    }

    setProfile(nextProfile)
    setLoading(false)
  })

  useEffect(() => {
    const loadProfile = async () => {
      await fetchProfile(user)
    }

    void loadProfile()

    return () => {
      activeRequestIdRef.current += 1
    }
  }, [user])

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<ProfileRecord, 'avatar_url' | 'full_name'>>,
      fallbackMessage: string,
      successMessage: string,
    ) => {
      if (!user) {
        return {
          message: 'Vous devez etre connecte pour modifier votre profil.',
          ok: false,
        } satisfies MutationResult
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select(PROFILE_FIELDS)
        .single()

      if (updateError) {
        return {
          message: getErrorMessage(updateError, fallbackMessage),
          ok: false,
        } satisfies MutationResult
      }

      const nextProfile = data as ProfileRecord

      setProfile(nextProfile)

      if (Object.prototype.hasOwnProperty.call(updates, 'avatar_url')) {
        dispatchProfileAvatarUpdated(nextProfile.avatar_url)
      }

      return {
        message: successMessage,
        ok: true,
      } satisfies MutationResult
    },
    [user],
  )

  const saveFullName = useCallback(
    async (value: string) => {
      const validationError = validateFullName(value)

      if (validationError) {
        return {
          message: validationError,
          ok: false,
        } satisfies MutationResult
      }

      setSavingName(true)

      try {
        return await updateProfile(
          { full_name: normalizeFullName(value) },
          'Impossible de mettre a jour votre nom complet.',
          'Nom complet mis a jour.',
        )
      } finally {
        setSavingName(false)
      }
    },
    [updateProfile],
  )

  const saveAvatar = useCallback(
    async (avatar: AvatarName) => {
      if (!isKnownAvatar(avatar)) {
        return {
          message: 'Cet avatar est invalide.',
          ok: false,
        } satisfies MutationResult
      }

      if (profile?.avatar_url === avatar) {
        return {
          message: 'Cet avatar est deja actif.',
          ok: true,
        } satisfies MutationResult
      }

      setSavingAvatar(true)

      try {
        return await updateProfile(
          { avatar_url: avatar },
          "Impossible de mettre a jour l'avatar.",
          'Avatar mis a jour.',
        )
      } finally {
        setSavingAvatar(false)
      }
    },
    [profile?.avatar_url, updateProfile],
  )

  const deleteAccount = useCallback(async () => {
    if (!user) {
      return {
        message: 'Vous devez etre connecte pour supprimer votre compte.',
        ok: false,
      } satisfies MutationResult
    }

    setDeletingAccount(true)

    try {
      const { error: deleteError } = await supabase.rpc('delete_my_account')

      if (deleteError) {
        return {
          message: getErrorMessage(
            deleteError,
            'Impossible de supprimer votre compte.',
          ),
          ok: false,
        } satisfies MutationResult
      }

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        return {
          message: getErrorMessage(
            signOutError,
            'Le compte a ete supprime, mais la deconnexion a echoue.',
          ),
          ok: false,
        } satisfies MutationResult
      }

      return {
        message: 'Compte supprime.',
        ok: true,
      } satisfies MutationResult
    } finally {
      setDeletingAccount(false)
    }
  }, [user])

  return {
    deleteAccount,
    deletingAccount,
    error,
    loading,
    postCount,
    profile,
    saveAvatar,
    saveFullName,
    savingAvatar,
    savingName,
  }
}
