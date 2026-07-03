import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  dispatchProfileAvatarUpdated,
  type AvatarName,
  type ProfileRecord,
  isKnownAvatar,
  normalizeFullName,
  pickRandomAvatar,
  validateFullName,
} from '../features/profile/profile'
import { useAuth } from '../providers/authProvider'
import { apiFetch } from '../lib/api'

type MutationResult = {
  message: string
  ok: boolean
}

const assignRandomAvatar = async (): Promise<ProfileRecord> => {
  const avatar = pickRandomAvatar()
  const data = await apiFetch<ProfileRecord>('/api/profiles/me', {
    method: 'PUT',
    body: JSON.stringify({ avatar_url: avatar }),
  })
  dispatchProfileAvatarUpdated(data.avatar_url)
  return data
}

export const useMyProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [postCount, setPostCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const activeRequestIdRef = useRef(0)

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

    const [profileResult, postCountResult] = await Promise.allSettled([
      apiFetch<ProfileRecord>('/api/profiles/me'),
      apiFetch<{ count: number }>('/api/profiles/me/post-count'),
    ])

    if (requestId !== activeRequestIdRef.current) {
      return
    }

    if (profileResult.status === 'rejected') {
      console.error('Error loading profile:', profileResult.reason)
      setError('Impossible de charger votre profil pour le moment.')
      setLoading(false)
      return
    }

    let nextProfile = profileResult.value

    if (!nextProfile.avatar_url) {
      try {
        nextProfile = await assignRandomAvatar()
      } catch (assignmentError) {
        console.error('Error assigning avatar:', assignmentError)
      }

      if (requestId !== activeRequestIdRef.current) {
        return
      }
    }

    if (postCountResult.status === 'rejected') {
      console.error('Error loading post count:', postCountResult.reason)
      setPostCount(0)
    } else {
      setPostCount(postCountResult.value.count)
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

      try {
        const nextProfile = await apiFetch<ProfileRecord>('/api/profiles/me', {
          method: 'PUT',
          body: JSON.stringify(updates),
        })

        setProfile(nextProfile)

        if (Object.prototype.hasOwnProperty.call(updates, 'avatar_url')) {
          dispatchProfileAvatarUpdated(nextProfile.avatar_url)
        }

        return { message: successMessage, ok: true } satisfies MutationResult
      } catch (err) {
        const message = err instanceof Error ? err.message : fallbackMessage
        return { message, ok: false } satisfies MutationResult
      }
    },
    [user],
  )

  const saveFullName = useCallback(
    async (value: string) => {
      const validationError = validateFullName(value)

      if (validationError) {
        return { message: validationError, ok: false } satisfies MutationResult
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
        return { message: 'Cet avatar est invalide.', ok: false } satisfies MutationResult
      }

      if (profile?.avatar_url === avatar) {
        return { message: 'Cet avatar est deja actif.', ok: true } satisfies MutationResult
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

  return {
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
