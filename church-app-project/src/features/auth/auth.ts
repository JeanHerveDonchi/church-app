const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_LETTER_PATTERN = /[A-Za-z]/
const PASSWORD_NUMBER_PATTERN = /\d/
const MIN_PASSWORD_LENGTH = 8

const getMessageFromError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message

    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim()
    }
  }

  return null
}

export const normalizeEmail = (value: string) => value.trim().toLowerCase()

export const validateEmail = (value: string) => {
  const normalized = normalizeEmail(value)

  if (!normalized) {
    return 'Ajoutez votre adresse e-mail.'
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return 'Adresse e-mail invalide.'
  }

  return null
}

export const validatePassword = (value: string) => {
  if (!value) {
    return 'Ajoutez votre mot de passe.'
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  if (!PASSWORD_LETTER_PATTERN.test(value) || !PASSWORD_NUMBER_PATTERN.test(value)) {
    return 'Utilisez au moins une lettre et un chiffre.'
  }

  return null
}

export const validatePasswordConfirmation = (
  password: string,
  confirmation: string,
) => {
  if (!confirmation) {
    return 'Confirmez votre mot de passe.'
  }

  if (password !== confirmation) {
    return 'Les mots de passe ne correspondent pas.'
  }

  return null
}

export const getSafeRedirectPath = (
  value: string | null | undefined,
  fallback = '/',
) => {
  const normalized = value?.trim()

  if (!normalized) {
    return fallback
  }

  if (!normalized.startsWith('/') || normalized.startsWith('//')) {
    return fallback
  }

  return normalized
}

export const buildAuthPath = (
  pathname: '/login' | '/signup',
  redirectPath?: string | null,
) => {
  const safeRedirectPath = getSafeRedirectPath(redirectPath, '')

  if (!safeRedirectPath || safeRedirectPath === '/') {
    return pathname
  }

  const searchParams = new URLSearchParams({
    redirect: safeRedirectPath,
  })

  return `${pathname}?${searchParams.toString()}`
}

export const getAuthErrorMessage = (error: unknown, fallbackMessage: string) => {
  const message = getMessageFromError(error)?.toLowerCase()

  if (!message) {
    return fallbackMessage
  }

  if (message.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.'
  }

  if (message.includes('email not confirmed')) {
    return 'Confirmez votre adresse e-mail avant de vous connecter.'
  }

  if (message.includes('user already registered')) {
    return 'Un compte existe deja avec cet e-mail.'
  }

  if (message.includes('unable to validate email address')) {
    return 'Adresse e-mail invalide.'
  }

  if (message.includes('password should be at least')) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  if (message.includes('signup is disabled')) {
    return "La creation de compte n'est pas disponible pour le moment."
  }

  if (message.includes('rate limit')) {
    return 'Trop de tentatives. Reessayez dans quelques instants.'
  }

  return fallbackMessage
}
