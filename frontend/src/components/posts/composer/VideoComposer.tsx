import { useState } from 'react'
import { ComposerStatusToggle } from '@/components/posts/composer/ComposerStatusToggle'
import {
  getErrorMessage,
  getYouTubeVideoId,
  isValidYouTubeUrl,
  normalizeOptionalText,
} from '@/features/posts/post'
import { useCreatePost } from '@/hooks/useCreatePost'
import type { CreateVideoPostPayload } from '@/types/post.types'

function VideoComposer() {
  const createPost = useCreatePost()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const videoId = getYouTubeVideoId(mediaUrl)
  const hasTypedUrl = mediaUrl.trim().length > 0
  const hasValidUrl = isValidYouTubeUrl(mediaUrl)
  const isSubmitDisabled =
    createPost.isPending || title.trim().length === 0 || !hasValidUrl

  const handleSubmit = async () => {
    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      setErrorMessage('Ajoutez un titre a votre video.')
      return
    }

    if (!hasValidUrl) {
      setErrorMessage('Ajoutez une URL YouTube valide avant de publier.')
      return
    }

    setErrorMessage(null)

    const payload: CreateVideoPostPayload = {
      content_type: 'video',
      title: normalizedTitle,
      description: normalizeOptionalText(description),
      media_url: mediaUrl.trim(),
      status,
    }

    try {
      await createPost.mutateAsync(payload)
      setTitle('')
      setDescription('')
      setMediaUrl('')
      setStatus('draft')
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible d'enregistrer cette video pour le moment.",
        ),
      )
    }
  }

  return (
    <div className="space-y-5">
      <input
        className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 font-serif text-3xl font-semibold tracking-tight text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white sm:text-4xl"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Titre de la video"
        type="text"
        value={title}
      />

      <textarea
        className="min-h-28 w-full resize-y rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description de la video."
        value={description}
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Lien YouTube
        </p>
        <input
          className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
          onChange={(event) => setMediaUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
          value={mediaUrl}
        />
        {hasTypedUrl && !hasValidUrl ? (
          <p className="text-sm text-stone-500">
            Utilisez une URL YouTube valide.
          </p>
        ) : null}
      </div>

      {videoId ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100">
          <img
            alt="Apercu de la video YouTube"
            className="aspect-video w-full object-cover"
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          />
        </div>
      ) : null}

      <ComposerStatusToggle onChange={setStatus} value={status} />

      {errorMessage ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">
          L&apos;apercu se met a jour automatiquement selon l&apos;URL.
        </p>

        <button
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-950 bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          disabled={isSubmitDisabled}
          onClick={() => {
            void handleSubmit()
          }}
          type="button"
        >
          {createPost.isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Publication...
            </>
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </div>
  )
}

export default VideoComposer
