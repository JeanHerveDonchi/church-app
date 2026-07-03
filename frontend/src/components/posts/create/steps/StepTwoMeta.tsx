import { getPostTypeLabel } from '@/features/posts/post'
import type { ContentType } from '@/types/post.types'

type StepTwoMetaProps = {
  contentType: ContentType
  title: string
  description: string
  draftId: string | null
  onTitleChange: (val: string) => void
  onDescriptionChange: (val: string) => void
  onSaveDraft: () => void
  onNext: () => void
  onBack: () => void
  onCancel: () => void
  isSaving: boolean
  saveError: string | null
}

function StepTwoMeta({
  contentType,
  title,
  description,
  draftId,
  onTitleChange,
  onDescriptionChange,
  onSaveDraft,
  onNext,
  onBack,
  onCancel,
  isSaving,
  saveError,
}: StepTwoMetaProps) {
  const normalizedTitleLength = title.trim().length
  const canContinue = normalizedTitleLength >= 3

  return (
    <div className="space-y-6">
      <div className="space-y-3">
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
            Etape 2
          </p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Ajoutez les détails de la publication
          </h2>
          <p className="text-sm leading-6 text-stone-500">
            Donnez un titre clair a cette publication, puis ajoutez une
            description facultative.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Titre
          </span>
          <input
            className={`w-full rounded-3xl border bg-stone-50 px-5 py-4 font-serif text-2xl font-semibold tracking-tight text-stone-950 outline-none transition placeholder:text-stone-400 focus:bg-white sm:text-3xl ${
              normalizedTitleLength > 0 && !canContinue
                ? 'border-stone-950'
                : 'border-stone-200 focus:border-stone-950'
            }`}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Reflexion sur le sermon du dimanche"
            type="text"
            value={title}
          />
          {normalizedTitleLength > 0 && !canContinue ? (
            <p className="text-sm text-stone-600">
              Le titre doit contenir au moins 3 caracteres.
            </p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Description
          </span>
          <textarea
            className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:bg-white"
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Partagez un court resume ou une invitation pour cette publication."
            rows={3}
            value={description}
          />
        </label>
      </div>

      {saveError ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          {saveError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onBack}
          type="button"
        >
          Retour
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCancel}
            type="button"
          >
            Annuler
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-300 bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving || !canContinue}
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
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            disabled={!canContinue}
            onClick={onNext}
            type="button"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  )
}

export default StepTwoMeta
