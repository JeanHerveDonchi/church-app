import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AccountDeletionDialog } from '@/components/AccountDeletionDialog'
import { AvatarPicker } from '../components/AvatarPicker'
import { Footer } from '../components/Footer'
import { resetLocalSession } from '../features/auth/session'
import { Navbar } from '../components/Navbar'
import { buildAuthPath } from '../features/auth/auth'
import {
  formatMemberSince,
  getAvatarSrc,
  normalizeFullName,
  validateFullName,
} from '../features/profile/profile'
import { useDeleteAccount } from '../hooks/useDeleteAccount'
import { useMyProfile } from '../hooks/useMyProfile'
import { useAuth } from '../providers/authProvider'

type SectionMessage = {
  kind: 'error' | 'success'
  text: string
}

type SectionCardProps = {
  children: ReactNode
  description?: string
  title: string
}

const getRoleMeta = (role: 'user' | 'admin' | 'super_admin' | null) => {
  if (role === 'super_admin') {
    return {
      badgeClassName:
        'border-stone-950/10 bg-stone-950 text-white shadow-[0_10px_24px_rgba(17,17,17,0.16)]',
      description: 'Acces complet aux outils de gestion et a la configuration.',
      label: 'Super administrateur',
    }
  }

  if (role === 'admin') {
    return {
      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-900 shadow-[0_10px_24px_rgba(180,83,9,0.14)]',
      description: 'Peut publier et gerer le contenu de la communaute.',
      label: 'Administrateur',
    }
  }

  return {
    badgeClassName:
      'border-stone-200 bg-white text-stone-700 shadow-[0_10px_24px_rgba(120,113,108,0.08)]',
    description: 'Compte membre actif sur la plateforme.',
    label: 'Membre',
  }
}

function SectionCard({ children, description, title }: SectionCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-5 shadow-[0_18px_40px_rgba(17,17,17,0.05)]">
      <div className="space-y-1 border-b border-stone-200 pb-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-950">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-stone-500">{description}</p>
        ) : null}
      </div>

      <div className="pt-4">{children}</div>
    </section>
  )
}

function SectionFeedback({ message }: { message: SectionMessage | null }) {
  if (!message) {
    return null
  }

  return (
    <p
      className={`rounded-2xl border px-4 py-3 text-sm ${message.kind === 'error'
          ? 'border-stone-950 bg-stone-100 text-stone-950'
          : 'border-stone-300 bg-white text-stone-700'
        }`}
    >
      {message.text}
    </p>
  )
}

function ProfileLoadingState() {
  return (
    <div className="grid gap-5 pt-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <div className="grid gap-5">
        {[0, 1, 2].map((item) => (
          <div
            className="animate-pulse rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-5"
            key={item}
          >
            <div className="h-6 w-40 rounded-full bg-stone-200" />
            <div className="mt-5 grid gap-3">
              <div className="h-12 rounded-2xl bg-stone-200" />
              <div className="h-12 rounded-2xl bg-stone-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="animate-pulse rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-5">
        <div className="h-6 w-28 rounded-full bg-stone-200" />
        <div className="mt-5 flex justify-center">
          <div className="h-32 w-32 rounded-full bg-stone-200" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div className="h-24 rounded-3xl bg-stone-200" key={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { loading: authLoading, role, user } = useAuth()
  const deleteAccount = useDeleteAccount()
  const {
    error,
    loading,
    postCount,
    profile,
    saveAvatar,
    saveFullName,
    savingAvatar,
    savingName,
  } = useMyProfile()
  const [fullNameDraft, setFullNameDraft] = useState<string | null>(null)
  const [nameMessage, setNameMessage] = useState<SectionMessage | null>(null)
  const [avatarMessage, setAvatarMessage] = useState<SectionMessage | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const fullNameInput = fullNameDraft ?? profile?.full_name ?? ''
  const fullNameValidationError = validateFullName(fullNameInput)
  const normalizedFullName = normalizeFullName(fullNameInput)
  const isNameUnchanged = normalizedFullName === (profile?.full_name ?? null)
  const roleMeta = getRoleMeta(role)
  const loginPath = buildAuthPath(
    '/login',
    `${location.pathname}${location.search}${location.hash}`,
  )

  useEffect(() => {
    if (nameMessage?.kind !== 'success') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setNameMessage(null)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [nameMessage])

  useEffect(() => {
    if (avatarMessage?.kind !== 'success') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setAvatarMessage(null)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [avatarMessage])

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
          <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Mon compte
              </h1>
              <p className="text-sm text-stone-500 sm:text-base">
                Verification de votre session en cours.
              </p>
            </div>

            <ProfileLoadingState />
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to={loginPath} />
  }

  const handleFullNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNameMessage(null)

    const result = await saveFullName(fullNameInput)

    setNameMessage({
      kind: result.ok ? 'success' : 'error',
      text: result.message,
    })

    if (result.ok) {
      setFullNameDraft(null)
    }
  }

  const handleAvatarChange = async (avatar: Parameters<typeof saveAvatar>[0]) => {
    setAvatarMessage(null)

    const result = await saveAvatar(avatar)

    setAvatarMessage({
      kind: result.ok ? 'success' : 'error',
      text: result.message,
    })
  }

  const handleDeleteAccount = async (values: Record<string, string>) => {
    setDeleteErrorMessage(null)

    try {
      await deleteAccount.mutateAsync({
        requesterEmail: values.requesterEmail,
      })
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de supprimer votre compte pour le moment.',
      )
      return
    }

    const { error: signOutError } = await resetLocalSession()

    if (signOutError) {
      console.error('Error resetting session after account deletion:', signOutError)
    }

    queryClient.clear()
    setIsDeleteDialogOpen(false)

    if (typeof window !== 'undefined') {
      window.location.replace('/login')
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="flex flex-col gap-6 border-b border-stone-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Mon compte
              </h1>
              <p className="max-w-2xl text-sm text-stone-500 sm:text-base">
                Retrouvez vos informations de profil, votre avatar et les
                détails de votre compte.
              </p>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Compte connecté
              </p>
              <p className="mt-1 font-medium text-stone-950">
                {profile?.email ?? user.email}
              </p>
              <div className="mt-3 space-y-2">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${roleMeta.badgeClassName}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                  <span>{roleMeta.label}</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? <ProfileLoadingState /> : null}

          {!loading && error ? (
            <div className="pt-6">
              <SectionFeedback
                message={{
                  kind: 'error',
                  text: error,
                }}
              />
            </div>
          ) : null}

          {!loading && !error && profile ? (
            <div className="grid gap-5 pt-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <div className="grid gap-5">
                <SectionCard
                  description=""
                  title="Informations utilisateur"
                >
                  <form className="grid gap-4" onSubmit={handleFullNameSubmit}>
                    <label className="space-y-2">
                      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Email
                      </span>
                      <input
                        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-500 outline-none"
                        readOnly
                        type="email"
                        value={profile.email}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Nom complet
                      </span>
                      <input
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:bg-white ${fullNameValidationError
                            ? 'border-stone-950'
                            : 'border-stone-300 focus:border-stone-950'
                          }`}
                        maxLength={100}
                        onChange={(event) => {
                          setFullNameDraft(event.target.value)
                          setNameMessage(null)
                        }}
                        placeholder="Votre nom complet"
                        type="text"
                        value={fullNameInput}
                      />
                    </label>

                    <div className="space-y-3">
                      {fullNameValidationError ? (
                        <p className="text-sm text-red-600">
                          {fullNameValidationError}
                        </p>
                      ) : null}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            savingName ||
                            Boolean(fullNameValidationError) ||
                            isNameUnchanged
                          }
                          type="submit"
                        >
                          {savingName ? 'Enregistrement...' : 'Enregistrer'}
                        </button>

                        {nameMessage ? (
                          <SectionFeedback message={nameMessage} />
                        ) : null}
                      </div>
                    </div>
                  </form>
                </SectionCard>

                <SectionCard title="Informations du compte">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-stone-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Ancienneté
                      </p>
                      <p className="mt-3 text-lg font-medium text-stone-950">
                        {formatMemberSince(profile.created_at)}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-stone-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Publications
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-stone-950">
                        {postCount}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                description="Choisissez l'avatar qui vous ressemble. Il apparaitra sur votre compte et dans le menu."
                title="Avatar"
              >
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-5 text-center">
                    <img
                      alt="Avatar actuel"
                      className="h-32 w-32 rounded-full border border-stone-400 object-cover shadow-[0_18px_30px_rgba(17,17,17,0.08)]"
                      src={getAvatarSrc(profile.avatar_url)}
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Avatar actuel
                      </p>
                      <p className="text-sm text-stone-600">
                        Choisissez un avatar simple et reconnaissable.
                      </p>
                    </div>
                  </div>

                  <AvatarPicker
                    disabled={savingAvatar}
                    onSelect={handleAvatarChange}
                    selectedAvatar={profile.avatar_url}
                  />

                  {avatarMessage ? (
                    <SectionFeedback message={avatarMessage} />
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard
                description="La suppression est définitive et vous déconnectera immediatement."
                title="Zone sensible"
              >
                <div className="space-y-4">
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-stone-950 bg-white px-5 py-3 text-sm font-medium text-stone-950 transition hover:-translate-y-0.5 hover:bg-stone-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deleteAccount.isPending}
                    onClick={() => {
                      setDeleteErrorMessage(null)
                      setIsDeleteDialogOpen(true)
                    }}
                    type="button"
                  >
                    {deleteAccount.isPending
                      ? 'Suppression en cours...'
                      : 'Supprimer mon compte'}
                  </button>
                </div>
              </SectionCard>
            </div>
          ) : null}
        </section>
      </main>

      <AccountDeletionDialog
        confirmationDescription="Saisissez votre e-mail pour continuer."
        confirmationTitle="Confirmer avec votre e-mail"
        errorMessage={deleteErrorMessage}
        fields={[
          {
            autoComplete: 'email',
            expectedValue: profile?.email ?? user.email ?? '',
            id: 'requesterEmail',
            invalidMessage: 'Cette adresse ne correspond pas.',
            label: 'Votre e-mail',
            placeholder: 'vous@exemple.com',
            requiredMessage: 'Saisissez votre e-mail.',
          },
        ]}
        loading={deleteAccount.isPending}
        onClose={() => {
          setDeleteErrorMessage(null)
          setIsDeleteDialogOpen(false)
        }}
        onConfirm={handleDeleteAccount}
        open={isDeleteDialogOpen}
        warningDescription="Cette action est irréversible."
        warningTitle="Supprimer mon compte"
      />

      <Footer />
    </div>
  )
}

export default Profile
