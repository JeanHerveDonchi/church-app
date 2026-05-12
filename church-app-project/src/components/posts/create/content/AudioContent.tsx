import { useEffect } from 'react'

type AudioContentProps = {
  value: string
  onChange: (val: string) => void
  onValidationChange: (isValid: boolean) => void
}

const soundcloudRegex =
  /^https?:\/\/(www\.)?soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/

function AudioContent({
  value,
  onChange,
  onValidationChange,
}: AudioContentProps) {
  const normalizedValue = value.trim()
  const isValid = soundcloudRegex.test(normalizedValue)
  const showError = normalizedValue.length > 0 && !isValid

  useEffect(() => {
    onValidationChange(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="space-y-4">
      <label className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Lien SoundCloud
        </span>
        <input
          className={`w-full rounded-3xl border bg-stone-50 px-5 py-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:bg-white ${
            showError
              ? 'border-stone-950'
              : 'border-stone-200 focus:border-stone-950'
          }`}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://soundcloud.com/artist/track"
          type="url"
          value={value}
        />
      </label>

      {showError ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          Veuillez entrer une URL SoundCloud valide.
        </p>
      ) : null}

      {isValid ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100 shadow-[0_18px_40px_rgba(17,17,17,0.05)]">
          <iframe
            frameBorder="no"
            height="166"
            scrolling="no"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(value)}&color=%23ff5500`}
            title="Apercu SoundCloud"
            width="100%"
          />
        </div>
      ) : null}
    </div>
  )
}

export default AudioContent
