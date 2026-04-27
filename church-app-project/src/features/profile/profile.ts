export const AVATAR_OPTIONS = [
  'bear.png',
  'cat.png',
  'chicken.png',
  'giraffe.png',
  'koala.png',
  'meerkat.png',
  'panda.png',
  'rabbit.png',
  'weasel.png',
] as const

export type AvatarName = (typeof AVATAR_OPTIONS)[number]

export type ProfileRecord = {
  avatar_url: string | null
  created_at: string
  email: string
  full_name: string | null
  id: string
}

export const DEFAULT_AVATAR: AvatarName = 'panda.png'
export const PROFILE_FIELDS = 'id, email, full_name, avatar_url, created_at'
export const PROFILE_AVATAR_UPDATED_EVENT = 'profile-avatar-updated'

const avatarSet = new Set<string>(AVATAR_OPTIONS)

export const isKnownAvatar = (value: string | null | undefined): value is AvatarName =>
  value !== null && value !== undefined && avatarSet.has(value)

export const getAvatarName = (
  avatarUrl: string | null | undefined,
): AvatarName => {
  if (isKnownAvatar(avatarUrl)) {
    return avatarUrl
  }

  return DEFAULT_AVATAR
}

export const getAvatarSrc = (avatarUrl: string | null | undefined) =>
  `/avatars/${getAvatarName(avatarUrl)}`

export const dispatchProfileAvatarUpdated = (
  avatarUrl: string | null | undefined,
) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(PROFILE_AVATAR_UPDATED_EVENT, {
      detail: {
        avatarUrl: avatarUrl ?? null,
      },
    }),
  )
}

export const getAvatarLabel = (avatar: string) =>
  avatar.replace('.png', '').replaceAll('-', ' ')

export const pickRandomAvatar = (): AvatarName =>
  AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]

export const normalizeFullName = (value: string): string | null => {
  const normalized = value.replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : null
}

export const validateFullName = (value: string): string | null => {
  const normalized = normalizeFullName(value)

  if (normalized === null) {
    return null
  }

  if (normalized.length > 100) {
    return 'Le nom complet doit contenir 100 caracteres maximum.'
  }

  if (normalized.split(' ').length > 3) {
    return 'Le nom complet doit contenir 3 mots maximum.'
  }

  if (!/^[\p{L}' ]+$/u.test(normalized)) {
    return "Utilisez uniquement des lettres, des espaces et l'apostrophe."
  }

  return null
}

export const formatMemberSince = (createdAt: string | null | undefined) => {
  if (!createdAt) {
    return 'Membre depuis date inconnue'
  }

  const date = new Date(createdAt)

  if (Number.isNaN(date.valueOf())) {
    return 'Membre depuis date inconnue'
  }

  const formattedDate = new Intl.DateTimeFormat('fr-CA', {
    month: 'short',
    year: 'numeric',
  }).format(date)

  return `Membre depuis ${formattedDate}`
}
