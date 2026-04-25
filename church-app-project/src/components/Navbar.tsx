import { useEffect, useRef, useState } from 'react'
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

export function Navbar({ title = "Bibliotheque de l'eglise" }: NavbarProps) {
  const { loading, role, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

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
    })
  }

  const handleLogout = async () => {
    closeMenu()
    await supabase.auth.signOut()
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
      onClick: handlePlaceholderAction('Mon compte'),
    })

    if (role === 'admin' || role === 'super_admin') {
      actions.push(
        {
          label: 'Creer une publication',
          onClick: handlePlaceholderAction('Creer une publication'),
        },
        {
          label: 'Gerer mes publications',
          onClick: handlePlaceholderAction('Gerer mes publications'),
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
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <p className="font-serif text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
        {title}
      </p>

      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="inline-flex min-w-28 items-center justify-between gap-3 rounded-full border border-stone-300 bg-white/90 px-4 py-2.5 text-sm font-medium text-stone-950 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-950 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-stone-300"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <span>Actions</span>
          <span aria-hidden="true" className="text-xs">
            v
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
