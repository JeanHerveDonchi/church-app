import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
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
  validatePassword,
  validatePasswordConfirmation,
} from '@/features/auth/auth'
import { useAuthFlow } from '@/hooks/useAuthFlow'
import { useAuth } from '@/providers/authProvider'
import { supabase } from '@/providers/supabaseClient'

type TouchedState = {
  confirmPassword: boolean
  email: boolean
  password: boolean
}

function Signup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loading, user } = useAuth()
  const { checkEmailLifecycle } = useAuthFlow()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touched, setTouched] = useState<TouchedState>({
    confirmPassword: false,
    email: false,
    password: false,
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isCheckingLifecycle, setIsCheckingLifecycle] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'), '/')
  const hasCompletedSignup = successMessage !== null

  const emailError = useMemo(() => validateEmail(email), [email])
  const passwordError = useMemo(() => validatePassword(password), [password])
  const confirmPasswordError = useMemo(
    () => validatePasswordConfirmation(password, confirmPassword),
    [confirmPassword, password],
  )
  const canSubmit = !emailError && !passwordError && !confirmPasswordError

  if (!loading && user) {
    return <Navigate replace to={redirectPath} />
  }

  // On email blur: check if this email belongs to a deleted account.
  // Self-deleted → redirect to /recover (they should restore, not re-register).
  // Admin-deleted → redirect to /login with block message.
  // Active / no profile → allow signup to proceed.
  const handleEmailBlur = async () => {
    setTouched((current) => ({ ...current, email: true }))
    if (!email || emailError) return

    setIsCheckingLifecycle(true)
    try {
      const result = await checkEmailLifecycle(email)
      if (result?.state === 'self_deleted') {
        navigate('/recover', { state: { email } })
      }
    } finally {
      setIsCheckingLifecycle(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    setFormError(null)
    setSuccessMessage(null)

    if (!canSubmit) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${buildAuthPath('/login', redirectPath)}`,
        },
      })

      if (error) {
        setFormError(
          getAuthErrorMessage(error, "Impossible de creer votre compte pour le moment."),
        )
        return
      }

      setPassword('')
      setConfirmPassword('')
      setTouched({ confirmPassword: false, email: false, password: false })
      setSubmitAttempted(false)
      setSuccessMessage('Verifiez votre e-mail pour activer votre compte.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const shouldShowEmailError = (touched.email || submitAttempted) && emailError
  const shouldShowPasswordError = (touched.password || submitAttempted) && passwordError
  const shouldShowConfirmPasswordError =
    (touched.confirmPassword || submitAttempted) && confirmPasswordError

  const isBusy = isSubmitting || isCheckingLifecycle

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="mx-auto flex w-full max-w-md flex-col gap-6">
            <div className="space-y-2 border-b border-stone-200 pb-6">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Creer un compte
              </h1>
            </div>

            {hasCompletedSignup ? (
              <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-[0_18px_40px_rgba(16,185,129,0.12)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-white p-2 text-stone-950 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <p className="pt-1 text-sm font-medium text-emerald-900">
                    {successMessage}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <form
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleSubmit()
                  }}
                >
                  <label className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Email
                    </span>
                    <input
                      autoComplete="email"
                      className={`w-full rounded-3xl border bg-stone-50 px-5 py-4 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:bg-white ${
                        shouldShowEmailError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-stone-200 focus:border-stone-950'
                      }`}
                      onBlur={() => { void handleEmailBlur() }}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setFormError(null)
                      }}
                      placeholder="vous@exemple.com"
                      type="email"
                      value={email}
                    />
                    {shouldShowEmailError ? (
                      <p className="text-sm text-red-600">{emailError}</p>
                    ) : null}
                  </label>

                  <PasswordField
                    autoComplete="new-password"
                    error={shouldShowPasswordError ? passwordError : null}
                    label="Mot de passe"
                    onBlur={() =>
                      setTouched((current) => ({ ...current, password: true }))
                    }
                    onChange={(value) => {
                      setPassword(value)
                      setFormError(null)
                    }}
                    placeholder="Choisissez un mot de passe"
                    value={password}
                  />

                  <PasswordField
                    autoComplete="new-password"
                    error={shouldShowConfirmPasswordError ? confirmPasswordError : null}
                    label="Confirmer le mot de passe"
                    onBlur={() =>
                      setTouched((current) => ({ ...current, confirmPassword: true }))
                    }
                    onChange={(value) => {
                      setConfirmPassword(value)
                      setFormError(null)
                    }}
                    placeholder="Retapez votre mot de passe"
                    value={confirmPassword}
                  />

                  {formError ? (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </p>
                  ) : null}

                  <button
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                    disabled={isBusy}
                    type="submit"
                  >
                    {isSubmitting ? 'Creation...' : isCheckingLifecycle ? 'Vérification...' : 'Creer mon compte'}
                  </button>
                </form>

                <p className="text-sm text-stone-500">
                  Deja un compte ?{' '}
                  <Link
                    className="font-medium text-stone-950 transition hover:text-stone-700"
                    to={buildAuthPath('/login', redirectPath)}
                  >
                    Se connecter
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Signup
