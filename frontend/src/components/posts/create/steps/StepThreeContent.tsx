import { useState } from 'react'
import ArticleContent from '@/components/posts/create/content/ArticleContent'
import AudioContent from '@/components/posts/create/content/AudioContent'
import VideoContent from '@/components/posts/create/content/VideoContent'
import { getPostTypeLabel } from '@/features/posts/post'
import type { ContentType, TipTapContent } from '@/types/post.types'

type StepThreeContentProps = {
  contentType: ContentType
  textContent: TipTapContent | null
  mediaUrl: string
  draftId: string | null
  title: string
  description: string
  onTextChange: (val: TipTapContent) => void
  onMediaChange: (val: string) => void
  onSaveDraft: () => void
  onPublish: () => void
  onBack: () => void
  isSaving: boolean
  isPublishing: boolean
  saveError: string | null
  publishError: string | null
  publishSuccess: string | null
}

function StepThreeContent({
  contentType,
  textContent,
  mediaUrl,
  draftId,
  title,
  description,
  onTextChange,
  onMediaChange,
  onSaveDraft,
  onPublish,
  onBack,
  isSaving,
  isPublishing,
  saveError,
  publishError,
  publishSuccess,
}: StepThreeContentProps) {
  const [isValidMedia, setIsValidMedia] = useState(contentType === 'blogpost')
  const isRedirectingAfterPublish = publishSuccess !== null
  const isBusy = isSaving || isPublishing || isRedirectingAfterPublish

  const canPublish =
    title.trim().length >= 3 &&
    (contentType === 'blogpost' || isValidMedia) &&
    !isBusy

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
            {getPostTypeLabel(contentType)}
          </span>
          {draftId ? (
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500">
              Brouillon enregistre
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Etape 3
          </p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Ajoutez le contenu de la publication
          </h2>
          <p className="text-sm leading-6 text-stone-500">
            Finalisez le contenu, puis enregistrez un brouillon ou publiez la
            publication.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-4 shadow-[0_12px_30px_rgba(17,17,17,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Resume de la publication
          </p>
          <h3 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-stone-950">
            {title}
          </h3>
          {description.trim().length > 0 ? (
            <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
          ) : (
            <p className="mt-2 text-sm text-stone-500">
              Aucune description pour le moment.
            </p>
          )}
        </div>
      </div>

      {contentType === 'blogpost' ? (
        <ArticleContent onChange={onTextChange} value={textContent} />
      ) : null}

      {contentType === 'video' ? (
        <VideoContent
          onChange={onMediaChange}
          onValidationChange={setIsValidMedia}
          value={mediaUrl}
        />
      ) : null}

      {contentType === 'audio' ? (
        <AudioContent
          onChange={onMediaChange}
          onValidationChange={setIsValidMedia}
          value={mediaUrl}
        />
      ) : null}

      {saveError ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          {saveError}
        </p>
      ) : null}

      {publishError ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          {publishError}
        </p>
      ) : null}

      {publishSuccess ? (
        <p className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700">
          {publishSuccess}
        </p>
      ) : null}

      <div className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-[0_16px_35px_rgba(17,17,17,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={onBack}
            type="button"
          >
            ← Retour
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-300 bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={onSaveDraft}
              type="button"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-stone-950" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le brouillon'
              )}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
              disabled={!canPublish}
              onClick={onPublish}
              type="button"
            >
              {isPublishing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Publication...
                </>
              ) : isRedirectingAfterPublish ? (
                'Redirection...'
              ) : (
                'Publier'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StepThreeContent
