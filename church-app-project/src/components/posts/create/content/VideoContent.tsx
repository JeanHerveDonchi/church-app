import { useEffect } from 'react'

type VideoContentProps = {
  value: string
  onChange: (val: string) => void
  onValidationChange: (isValid: boolean) => void
}

// eslint-disable-next-line no-useless-escape
const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/

function VideoContent({
  value,
  onChange,
  onValidationChange,
}: VideoContentProps) {
  const normalizedValue = value.trim()
  const videoId = normalizedValue.match(youtubeRegex)?.[1] ?? null
  const showError = normalizedValue.length > 0 && !videoId

  useEffect(() => {
    onValidationChange(Boolean(videoId))
  }, [onValidationChange, videoId])

  return (
    <div className="space-y-4">
      <label className="space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Lien YouTube
        </span>
        <input
          className={`w-full rounded-3xl border bg-stone-50 px-5 py-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:bg-white ${
            showError
              ? 'border-stone-950'
              : 'border-stone-200 focus:border-stone-950'
          }`}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
          value={value}
        />
      </label>

      {showError ? (
        <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
          Veuillez entrer une URL YouTube valide.
        </p>
      ) : null}

      {videoId ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100 shadow-[0_18px_40px_rgba(17,17,17,0.05)]">
          <img
            alt="Apercu miniature YouTube"
            className="aspect-video w-full object-cover"
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          />
        </div>
      ) : null}
    </div>
  )
}

export default VideoContent
