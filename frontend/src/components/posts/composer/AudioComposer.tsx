import { useState } from 'react'
import { ComposerStatusToggle } from '@/components/posts/composer/ComposerStatusToggle'
import {
  getErrorMessage,
  getSoundCloudEmbedUrl,
  isValidSoundCloudUrl,
  normalizeOptionalText,
} from '@/features/posts/post'
import { useCreatePost } from '@/hooks/useCreatePost'
import type { CreateAudioPostPayload } from '@/types/post.types'

function AudioComposer() {
  const createPost = useCreatePost()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasTypedUrl = mediaUrl.trim().length > 0
  const hasValidUrl = isValidSoundCloudUrl(mediaUrl)
  const isSubmitDisabled =
    createPost.isPending || title.trim().length === 0 || !hasValidUrl

  const handleSubmit = async () => {
    const normalizedTitle = title.trim()

    if (!normalizedTitle) {
      setErrorMessage('Ajoutez un titre a votre audio.')
      return
    }

    if (!hasValidUrl) {
      setErrorMessage('Ajoutez une URL SoundCloud valide avant de publier.')
      return
    }

    setErrorMessage(null)

    const payload: CreateAudioPostPayload = {
      content_type: 'audio',
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
          "Impossible d'enregistrer cet audio pour le moment.",
        ),
      )
    }
  }

  return (
    <div className="space-y-5">
      <input
        className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 font-serif text-3xl font-semibold tracking-tight text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white sm:text-4xl"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Titre de l'audio"
        type="text"
        value={title}
      />

      <textarea
        className="min-h-28 w-full resize-y rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description de l'audio."
        value={description}
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Lien SoundCloud
        </p>
        <input
          className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
          onChange={(event) => setMediaUrl(event.target.value)}
          placeholder="https://soundcloud.com/..."
          type="url"
          value={mediaUrl}
        />
        {hasTypedUrl && !hasValidUrl ? (
          <p className="text-sm text-stone-500">
            Utilisez une URL SoundCloud valide.
          </p>
        ) : null}
      </div>

      {hasValidUrl ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100">
          <iframe
            allow="autoplay"
            className="h-44 w-full"
            src={getSoundCloudEmbedUrl(mediaUrl)}
            title="Apercu SoundCloud"
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
          L&apos;embed confirme visuellement que le lien est bien reconnu.
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

export default AudioComposer
