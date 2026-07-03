import {
  AVATAR_OPTIONS,
  type AvatarName,
  getAvatarLabel,
  getAvatarName,
  getAvatarSrc,
} from '../features/profile/profile'

type AvatarPickerProps = {
  disabled?: boolean
  onSelect: (avatar: AvatarName) => void | Promise<void>
  selectedAvatar: string | null | undefined
}

export function AvatarPicker({
  disabled = false,
  onSelect,
  selectedAvatar,
}: AvatarPickerProps) {
  const activeAvatar = getAvatarName(selectedAvatar)

  return (
    <div className="grid grid-cols-3 gap-3">
      {AVATAR_OPTIONS
      .filter((a) => a !== "default.png")
      .map((avatar) => {
        const isActive = activeAvatar === avatar

        return (
          <button
            aria-label={`Choisir l'avatar ${getAvatarLabel(avatar)}`}
            className={`group flex flex-col items-center gap-2 rounded-3xl border px-3 py-4 text-center text-xs font-medium uppercase tracking-[0.12em] transition focus:outline-none focus:ring-2 focus:ring-stone-300 ${
              isActive
                ? 'border-stone-500 bg-stone-100 text-stone-950'
                : 'border-stone-200 bg-white text-stone-600 hover:-translate-y-0.5 hover:border-stone-700 hover:text-stone-950'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            disabled={disabled}
            key={avatar}
            onClick={() => {
              void onSelect(avatar)
            }}
            type="button"
          >
            <img
              alt={`Avatar ${getAvatarLabel(avatar)}`}
              className={`h-14 w-14 rounded-full border object-cover transition ${
                isActive
                  ? 'border-stone-500 bg-white'
                  : 'border-stone-200 bg-stone-100 group-hover:border-stone-400'
              }`}
              src={getAvatarSrc(avatar)}
            />
            <span>{getAvatarLabel(avatar)}</span>
          </button>
        )
      })}
    </div>
  )
}
