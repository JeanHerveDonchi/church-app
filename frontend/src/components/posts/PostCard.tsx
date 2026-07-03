import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAvatarSrc } from '@/features/profile/profile'
import {
  getArticleExcerpt,
  getAuthorName,
  getPostDateLabel,
  getPostDetailRoute,
  getPostStatusLabel,
  getPostTypeLabel,
  getSoundCloudEmbedUrl,
  getYouTubeVideoId,
} from '@/features/posts/post'
import {
  isArticlePost,
  isAudioPost,
  isVideoPost,
  type TypedPost,
} from '@/types/post.types'

type PostCardProps = {
  actions?: ReactNode
  post: TypedPost
}

export function PostCard({ actions, post }: PostCardProps) {
  const navigate = useNavigate()

  const handleOpen = () => {
    navigate(getPostDetailRoute(post.id))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOpen()
    }
  }

  const stopActionPropagation = (
    event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
  ) => {
    event.stopPropagation()
  }

  const videoId = isVideoPost(post) ? getYouTubeVideoId(post.media_url) : null
  const articleExcerpt = isArticlePost(post)
    ? getArticleExcerpt(post.text_content)
    : null
  const authorName = getAuthorName(post.author)
  const formattedDate = getPostDateLabel(post)
  const statusClasses =
    post.status === 'published'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : post.status === 'draft'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-stone-300 bg-stone-100 text-stone-600'

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_18px_40px_rgba(17,17,17,0.06)] transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_22px_48px_rgba(17,17,17,0.08)] focus:outline-none focus:ring-2 focus:ring-stone-300"
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
            {getPostTypeLabel(post.content_type)}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusClasses}`}
          >
            {getPostStatusLabel(post.status)}
          </span>
        </div>
        <span className="text-sm text-stone-500">{formattedDate}</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {isVideoPost(post) ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-100">
            {videoId ? (
              <img
                alt={`Miniature pour ${post.title}`}
                className="aspect-video w-full object-cover"
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-stone-500">
                Apercu YouTube indisponible.
              </div>
            )}
          </div>
        ) : null}

        {isAudioPost(post) ? (
          <div className="pointer-events-none overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-100">
            <iframe
              allow="autoplay"
              className="h-36 w-full"
              src={getSoundCloudEmbedUrl(post.media_url)}
              title={`Apercu audio pour ${post.title}`}
            />
          </div>
        ) : null}

        {isArticlePost(post) ? (
          <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 px-4 py-5">
            <p className="text-sm leading-6 text-stone-600">
              {articleExcerpt ?? "Apercu de l'article indisponible pour le moment."}
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <h3 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
            {post.title}
          </h3>
          {post.description && !isArticlePost(post) ? (
            <p className="text-sm leading-6 text-stone-600">{post.description}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-3">
          <img
            alt={`Avatar de ${authorName}`}
            className="h-11 w-11 rounded-full border border-stone-300 bg-stone-100 object-cover"
            src={getAvatarSrc(post.author?.avatar_url)}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">
              {authorName}
            </p>
            <p className="text-sm text-stone-500">Touchez pour ouvrir</p>
          </div>
        </div>
      </div>

      {actions ? (
        <div
          className="border-t border-stone-200 bg-stone-50/60 px-5 py-4"
          onClick={stopActionPropagation}
          onKeyDown={stopActionPropagation}
        >
          {actions}
        </div>
      ) : null}
    </article>
  )
}
