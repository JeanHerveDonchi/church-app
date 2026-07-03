import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type PasswordFieldProps = {
  autoComplete?: string
  error?: string | null
  label: string
  onBlur?: () => void
  onChange: (value: string) => void
  placeholder: string
  value: string
}

export function PasswordField({
  autoComplete,
  error,
  label,
  onBlur,
  onChange,
  placeholder,
  value,
}: PasswordFieldProps) {
  const inputId = useId()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <label className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </span>

      <div className="relative">
        <input
          autoComplete={autoComplete}
          className={`w-full rounded-3xl border bg-stone-50 px-5 py-4 pr-14 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:bg-white ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-stone-200 focus:border-stone-950'
          }`}
          id={inputId}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={isVisible ? 'text' : 'password'}
          value={value}
        />

        <button
          aria-controls={inputId}
          aria-label={
            isVisible
              ? 'Masquer le mot de passe'
              : 'Afficher le mot de passe'
          }
          className="absolute inset-y-0 right-0 inline-flex w-14 items-center justify-center rounded-r-3xl text-stone-700 transition hover:text-stone-950 focus:outline-none focus:text-stone-950"
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? (
            <EyeOff className="h-5 w-5" strokeWidth={1.8} />
          ) : (
            <Eye className="h-5 w-5" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </label>
  )
}
