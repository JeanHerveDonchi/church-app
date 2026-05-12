import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  getAvatarSrc,
  PROFILE_AVATAR_UPDATED_EVENT,
} from '../features/profile/profile'
import { getUserPostsRoute } from '../features/posts/post'
import { useAuth } from '../providers/authProvider'
import { supabase } from '../providers/supabaseClient'

type NavbarProps = {
  title?: string
}

type MenuAction = {
  disabled?: boolean
  label: string
  onClick: () => void | Promise<void>
}

export function Navbar({ title = 'THC Global' }: NavbarProps) {
  const { loading, role, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    let isCurrent = true

    const loadAvatar = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (!isCurrent) {
        return
      }

      if (error) {
        console.error('Error loading navbar avatar:', error)
        return
      }

      setAvatarUrl(data?.avatar_url ?? null)
    }

    void loadAvatar()

    return () => {
      isCurrent = false
    }
  }, [location.pathname, user?.id])

  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl: string | null }>).detail
      setAvatarUrl(detail?.avatarUrl ?? null)
    }

    window.addEventListener(
      PROFILE_AVATAR_UPDATED_EVENT,
      handleAvatarUpdated as EventListener,
    )

    return () => {
      window.removeEventListener(
        PROFILE_AVATAR_UPDATED_EVENT,
        handleAvatarUpdated as EventListener,
      )
    }
  }, [])

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handlePlaceholderAction = (label: string) => () => {
    console.info(`${label} n'est pas encore connecte.`)
    closeMenu()
  }

  const handleLogin = async () => {
    closeMenu()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${location.pathname}`,
      },
    })
  }

  const handleLogout = async () => {
    closeMenu()
    await supabase.auth.signOut()
  }

  const handleAccountNavigation = () => {
    closeMenu()
    navigate('/profile')
  }

  const actions: MenuAction[] = []

  if (loading) {
    actions.push({
      disabled: true,
      label: 'Chargement...',
      onClick: () => {},
    })
  } else if (!user) {
    actions.push({
      label: 'Se connecter',
      onClick: handleLogin,
    })
  } else {
    actions.push({
      label: 'Mon compte',
      onClick: handleAccountNavigation,
    })

    if (role === 'admin' || role === 'super_admin') {
      actions.push(
        {
          label: 'Creer une publication',
          onClick: () => {
            closeMenu()
            navigate('/posts/create')
          },
        },
        {
          label: 'Gerer mes publications',
          onClick: () => {
            closeMenu();
            navigate(getUserPostsRoute(user.id))
          },
        },
      )
    }

    if (role === 'super_admin') {
      actions.push({
        label: 'Gerer les utilisateurs',
        onClick: handlePlaceholderAction('Gerer les utilisateurs'),
      })
    }

    actions.push({
      label: 'Deconnexion',
      onClick: handleLogout,
    })
  }

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <Link
        className="min-w-0 font-serif text-xl font-semibold tracking-tight text-stone-950 transition hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300 min-[428px]:text-2xl sm:text-3xl"
        to="/"
      >
        {title}
      </Link>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-stone-300 bg-white/90 px-3 py-2 text-[13px] font-medium text-stone-950 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-950 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-stone-300 min-[428px]:min-w-28 min-[428px]:justify-between min-[428px]:gap-3 min-[428px]:px-4 min-[428px]:py-2.5 min-[428px]:text-sm"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          {user ? (
            <img
              alt="Votre avatar"
              className="h-7 w-7 shrink-0 rounded-full border border-stone-300 bg-stone-100 object-cover min-[428px]:h-8 min-[428px]:w-8"
              src={getAvatarSrc(avatarUrl)}
            />
          ) : null}
          <span className="leading-none">Actions</span>
          <span
            aria-hidden="true"
            className="flex h-3 w-3 shrink-0 items-center justify-center text-stone-700"
          >
            <svg
              className="h-2.5 w-2.5 min-[428px]:h-3 min-[428px]:w-3"
              fill="none"
              viewBox="0 0 12 12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </span>
        </button>

        {isMenuOpen ? (
          <div
            className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-stone-200 bg-white/95 p-3 shadow-2xl shadow-stone-950/10 backdrop-blur"
            role="menu"
          >
            <div className="border-b border-stone-200 px-2 pb-3">
              <p className="text-sm font-medium text-stone-950">
                {user?.email ?? 'Invite'}
              </p>
            </div>

            <div className="mt-3 grid gap-2">
              {actions.map((action) => (
                <button
                  className="w-full rounded-2xl border border-transparent bg-stone-100 px-4 py-3 text-left text-sm font-medium text-stone-950 transition hover:border-stone-300 hover:bg-stone-200/70 focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={action.disabled}
                  key={action.label}
                  onClick={() => {
                    void action.onClick()
                  }}
                  role="menuitem"
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
