type ComposerStatus = 'draft' | 'published'

type ComposerStatusToggleProps = {
  onChange: (value: ComposerStatus) => void
  value: ComposerStatus
}

const options: Array<{ description: string; label: string; value: ComposerStatus }> = [
  {
    value: 'draft',
    label: 'Draft',
    description: 'Visible uniquement dans les vues admin.',
  },
  {
    value: 'published',
    label: 'Publish now',
    description: 'Publie immediatement dans le fil public.',
  },
]

export function ComposerStatusToggle({
  onChange,
  value,
}: ComposerStatusToggleProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
        Statut
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = value === option.value

          return (
            <button
              className={`rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-stone-300 ${
                isActive
                  ? 'border-stone-950 bg-stone-950 text-white shadow-lg shadow-stone-950/15'
                  : 'border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300 hover:bg-white'
              }`}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span
                className={`mt-1 block text-sm ${
                  isActive ? 'text-stone-200' : 'text-stone-500'
                }`}
              >
                {option.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
