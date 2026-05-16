import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PasswordField } from '@/components/PasswordField'
import {
  buildAuthPath,
  getAuthErrorMessage,
  getSafeRedirectPath,
  normalizeEmail,
  validateEmail,
} from '@/features/auth/auth'
import { useAuth } from '@/providers/authProvider'
import { supabase } from '@/providers/supabaseClient'

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'), '/')

  if (!loading && user) {
    return <Navigate replace to={redirectPath} />
  }

  const handleEmailLogin = async () => {
    const nextEmailError = validateEmail(email)
    const nextPasswordError = password ? null : 'Ajoutez votre mot de passe.'

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setFormError(null)

    if (nextEmailError || nextPasswordError) {
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      })

      if (error) {
        setFormError(
          getAuthErrorMessage(
            error,
            'Impossible de vous connecter pour le moment.',
          ),
        )
        return
      }

      navigate(redirectPath, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setFormError(null)
    setIsGoogleSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      })

      if (error) {
        setFormError(
          getAuthErrorMessage(
            error,
            'Impossible de lancer la connexion Google.',
          ),
        )
      }
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6">
            <div className="space-y-2 border-b border-stone-200 pb-6">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Connexion
              </h1>
              <p className="text-sm text-stone-500">Accedez a votre compte.</p>
            </div>

            <div className="grid gap-3">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || isGoogleSubmitting}
                onClick={() => {
                  void handleGoogleLogin()
                }}
                type="button"
              >
                {isGoogleSubmitting ? 'Connexion...' : 'Connexion avec Google'}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              <span>Email</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleEmailLogin()
              }}
            >
              <label className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Email
                </span>
                <input
                  autoComplete="email"
                  className={`w-full rounded-3xl border bg-stone-50 px-5 py-4 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:bg-white ${
                    emailError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-stone-200 focus:border-stone-950'
                  }`}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setEmailError(null)
                    setFormError(null)
                  }}
                  placeholder="vous@exemple.com"
                  type="email"
                  value={email}
                />
                {emailError ? (
                  <p className="text-sm text-red-600">{emailError}</p>
                ) : null}
              </label>

              <PasswordField
                autoComplete="current-password"
                error={passwordError}
                label="Mot de passe"
                onChange={(value) => {
                  setPassword(value)
                  setPasswordError(null)
                  setFormError(null)
                }}
                placeholder="Votre mot de passe"
                value={password}
              />

              {formError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}

              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                disabled={isSubmitting || isGoogleSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <p className="text-sm text-stone-500">
              Premiere visite ?{' '}
              <Link
                className="font-medium text-stone-950 transition hover:text-stone-700"
                to={buildAuthPath('/signup', redirectPath)}
              >
                Creer un compte
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Login
