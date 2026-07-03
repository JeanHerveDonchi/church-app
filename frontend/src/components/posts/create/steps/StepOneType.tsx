import type { ContentType } from '@/types/post.types'

type StepOneTypeProps = {
  selected: ContentType | null
  onSelect: (type: ContentType) => void
  onNext: () => void
  onCancel: () => void
}

type TypeOption = {
  description: string
  label: string
  value: ContentType
}

const options: TypeOption[] = [
  {
    value: 'blogpost',
    label: 'Article',
    description: "Redigez un article pour la communauté.",
  },
  {
    value: 'video',
    label: 'Video',
    description: 'Partagez un message YouTube avec un apercu rapide.',
  },
  {
    value: 'audio',
    label: 'Audio',
    description: 'Publiez un enseignement ou une devotion SoundCloud.',
  },
]

function TypeIcon({ type }: { type: ContentType }) {
  if (type === 'blogpost') {
    return (
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M7 5.75h10M7 10.75h10M7 15.75h6M6.5 3.75h11a1.75 1.75 0 0 1 1.75 1.75v13a1.75 1.75 0 0 1-1.75 1.75h-11a1.75 1.75 0 0 1-1.75-1.75v-13A1.75 1.75 0 0 1 6.5 3.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    )
  }

  if (type === 'video') {
    return (
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M15.5 8.5 19.5 6v12l-4-2.5m-8 3h6a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5.75 14.25a8 8 0 0 1 0-4.5m3 6a5 5 0 0 1 0-7.5m6.5 0a5 5 0 0 1 0 7.5m3-10.5a8 8 0 0 1 0 13.5M12 9.5v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function StepOneType({
  selected,
  onSelect,
  onNext,
  onCancel,
}: StepOneTypeProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Etape 1
        </p>
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Choisissez un type de publication
        </h2>
        <p className="text-sm leading-6 text-stone-500">
          Choisissez le format de contenu avant d&apos;ajouter les détails.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {options.map((option) => {
          const isActive = selected === option.value

          return (
            <button
              aria-pressed={isActive}
              className={`flex min-h-40 flex-col items-start gap-4 rounded-[1.75rem] border px-5 py-5 text-left transition focus:outline-none focus:ring-2 focus:ring-stone-300 ${
                isActive
                  ? 'border-stone-950 bg-stone-950 text-white shadow-[0_20px_40px_rgba(17,17,17,0.14)]'
                  : 'border-stone-200 bg-stone-50/80 text-stone-950 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white'
              }`}
              key={option.value}
              onClick={() => onSelect(option.value)}
              type="button"
            >
              <div
                className={`rounded-2xl border p-3 ${
                  isActive
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-stone-200 bg-white text-stone-700'
                }`}
              >
                <TypeIcon type={option.value} />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold">{option.label}</p>
                <p
                  className={`text-sm leading-6 ${
                    isActive ? 'text-stone-200' : 'text-stone-500'
                  }`}
                >
                  {option.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onCancel}
          type="button"
        >
          Annuler
        </button>
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          disabled={!selected}
          onClick={onNext}
          type="button"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

export default StepOneType
