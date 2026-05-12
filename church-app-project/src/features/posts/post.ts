import { formatDistanceToNow } from 'date-fns'
import { frCA } from 'date-fns/locale'
import type {
  ContentType,
  PostAuthor,
  PostStatus,
  TipTapContent,
  TipTapNode,
  TypedPost,
} from '@/types/post.types'

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/
const SOUND_CLOUD_HOST_PATTERN = /(^|\.)soundcloud\.com$/i
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}(?::?\d{2})?)$/i
const ARTICLE_EXCERPT_WORD_LIMIT = 14

const toValidYouTubeId = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const sanitized = value.trim()
  return YOUTUBE_ID_PATTERN.test(sanitized) ? sanitized : null
}

export const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message

    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return fallbackMessage
}

export const normalizeOptionalText = (value: string) => {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export const getYouTubeVideoId = (value: string) => {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  try {
    const url = new URL(normalized)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()

    if (hostname === 'youtu.be') {
      return toValidYouTubeId(url.pathname.split('/').filter(Boolean)[0] ?? null)
    }

    if (
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'music.youtube.com'
    ) {
      if (url.pathname === '/watch') {
        return toValidYouTubeId(url.searchParams.get('v'))
      }

      if (url.pathname.startsWith('/embed/')) {
        return toValidYouTubeId(url.pathname.split('/')[2] ?? null)
      }

      if (url.pathname.startsWith('/shorts/')) {
        return toValidYouTubeId(url.pathname.split('/')[2] ?? null)
      }
    }
  } catch {
    return null
  }

  return null
}

export const isValidYouTubeUrl = (value: string) => getYouTubeVideoId(value) !== null

export const isValidSoundCloudUrl = (value: string) => {
  const normalized = value.trim()

  if (!normalized) {
    return false
  }

  try {
    const url = new URL(normalized)

    if (!SOUND_CLOUD_HOST_PATTERN.test(url.hostname)) {
      return false
    }

    return url.pathname.split('/').filter(Boolean).length >= 2
  } catch {
    return false
  }
}

export const getSoundCloudEmbedUrl = (value: string) =>
  `https://w.soundcloud.com/player/?url=${encodeURIComponent(
    value.trim(),
  )}&color=%23a8a29e&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`

export const getYouTubeEmbedUrl = (videoId: string) =>
  `https://www.youtube.com/embed/${videoId}`

export const getPostTypeLabel = (contentType: ContentType) => {
  switch (contentType) {
    case 'video':
      return 'Video'
    case 'audio':
      return 'Audio'
    case 'blogpost':
      return 'Article'
  }
}

export const getPostStatusLabel = (status: PostStatus) => {
  switch (status) {
    case 'draft':
      return 'Brouillon'
    case 'published':
      return 'Publié'
    case 'archived':
      return 'Archive'
  }
}

export const getAuthorName = (author: PostAuthor | null) =>
  author?.full_name?.trim() || author?.email?.trim() || "Membre de l'eglise"

export const getUserPostsRoute = (userId: string) => `/posts/${userId}`

export const getPostDetailRoute = (postId: string) => `/posts/post/${postId}`

export const getEditPostRoute = (postId: string) => `/posts/post/${postId}/edit`

const collectTipTapText = (nodes: TipTapNode[] | undefined): string[] => {
  if (!nodes) {
    return []
  }

  return nodes.flatMap((node) => {
    const parts: string[] = []

    if (typeof node.text === 'string' && node.text.trim().length > 0) {
      parts.push(node.text.trim())
    }

    if (node.content) {
      parts.push(...collectTipTapText(node.content))
    }

    return parts
  })
}

export const getArticleExcerpt = (
  content: TipTapContent | null | undefined,
  wordLimit = ARTICLE_EXCERPT_WORD_LIMIT,
) => {
  if (!content) {
    return null
  }

  const plainText = collectTipTapText(content.content)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plainText) {
    return null
  }

  const words = plainText.split(' ')
  const excerpt = words.slice(0, wordLimit).join(' ')

  return words.length > wordLimit ? `${excerpt}...` : excerpt
}

export const parseAppDate = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const normalizedValue = value.trim().replace(' ', 'T')

  if (!normalizedValue) {
    return null
  }

  const timestamp = TIMEZONE_SUFFIX_PATTERN.test(normalizedValue)
    ? normalizedValue
    : `${normalizedValue}Z`
  const date = new Date(timestamp)

  if (Number.isNaN(date.valueOf())) {
    return null
  }

  return date
}

export const getRelativeDateLabel = (value: string) => {
  const date = parseAppDate(value)

  if (!date) {
    return 'Date inconnue'
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: frCA,
  })
}

export const getPostDateLabel = (
  post: Pick<TypedPost, 'created_at' | 'published_at'>,
) => {
  const rawValue = post.published_at ?? post.created_at
  const date = parseAppDate(rawValue)

  if (!date) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
  }).format(date)
}
