import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { AccountDeletionDialog } from '@/components/AccountDeletionDialog'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { buildAuthPath, normalizeEmail, validateEmail } from '@/features/auth/auth'
import {
  formatMemberSinceDate,
  getAvatarSrc,
  normalizeFullName,
  validateProfileSearchName,
} from '@/features/profile/profile'
import { useDeleteAccount } from '@/hooks/useDeleteAccount'
import { useAuth } from '@/providers/authProvider'
import { apiFetch } from '@/lib/api'

type RoleName = 'user' | 'admin' | 'super_admin'

type SearchMode = 'email' | 'name'

type SearchableProfile = {
  avatar_url: string | null
  created_at: string
  email: string
  full_name: string | null
  id: string
  role: RoleName | null
}

type SearchCardProps = {
  buttonLabel: string
  errorMessage: string | null
  iconLabel: string
  inputLabel: string
  inputName: string
  isBusy: boolean
  onChange: (value: string) => void
  onSubmit: () => void | Promise<void>
  placeholder: string
  value: string
}

const isRoleName = (value: string | null): value is RoleName =>
  value === 'user' || value === 'admin' || value === 'super_admin'

const isEligibleRole = (role: RoleName | null) => role === 'user' || role === 'admin'

const getRoleLabel = (role: RoleName | null) => {
  if (role === 'admin') return 'Administrateur'
  if (role === 'super_admin') return 'Super administrateur'
  return 'Membre'
}

const getRoleBadgeClassName = (role: RoleName | null) => {
  if (role === 'admin') return 'border-amber-200 bg-amber-50 text-amber-900'
  if (role === 'super_admin') return 'border-stone-950 bg-stone-950 text-white'
  return 'border-stone-200 bg-white text-stone-700'
}

const getChangeRoleLabel = (role: RoleName | null) => {
  if (role === 'admin') return 'Passer super admin'
  if (role === 'user') return 'Passer admin'
  return 'Changer le role'
}

const getDisplayName = (profile: SearchableProfile) =>
  profile.full_name?.trim() || 'Nom non renseigne'

const toSearchableProfile = (row: unknown): SearchableProfile | null => {
  if (!row || typeof row !== 'object') return null

  const profile = row as {
    avatar_url?: string | null
    created_at?: string
    email?: string
    full_name?: string | null
    id?: string
    role?: { name?: string | null } | null
  }

  if (
    typeof profile.created_at !== 'string' ||
    typeof profile.email !== 'string' ||
    typeof profile.id !== 'string'
  ) {
    return null
  }

  const roleName = profile.role?.name ?? null

  return {
    avatar_url: profile.avatar_url ?? null,
    created_at: profile.created_at,
    email: profile.email,
    full_name: profile.full_name ?? null,
    id: profile.id,
    role: isRoleName(roleName) ? roleName : null,
  }
}

function SearchCard({
  buttonLabel,
  errorMessage,
  iconLabel,
  inputLabel,
  inputName,
  isBusy,
  onChange,
  onSubmit,
  placeholder,
  value,
}: SearchCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-5 shadow-[0_18px_40px_rgba(17,17,17,0.05)]">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit()
        }}
      >
        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            {inputLabel}
          </span>
          <input
            className={`w-full rounded-3xl border bg-white px-5 py-4 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:bg-white ${
              errorMessage
                ? 'border-red-500 focus:border-red-500'
                : 'border-stone-200 focus:border-stone-950'
            }`}
            name={inputName}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type="text"
            value={value}
          />
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}
        </label>

        <div className="flex justify-end">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-stone-950 bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            disabled={isBusy}
            type="submit"
          >
            <Search className="h-4 w-4" strokeWidth={1.8} />
            <span>{isBusy ? `${iconLabel}...` : buttonLabel}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

function ManageUsers() {
  const location = useLocation()
  const { loading, role, user } = useAuth()
  const deleteAccount = useDeleteAccount()
  const [emailQuery, setEmailQuery] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [profiles, setProfiles] = useState<SearchableProfile[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [activeSearchMode, setActiveSearchMode] = useState<SearchMode | null>(null)
  const [profileToDelete, setProfileToDelete] = useState<SearchableProfile | null>(null)

  const loginPath = buildAuthPath(
    '/login',
    `${location.pathname}${location.search}${location.hash}`,
  )

  const runSearch = async (mode: SearchMode, query: string) => {
    if (!user) return

    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
    setActiveSearchMode(mode)

    try {
      const params = new URLSearchParams({ mode, q: query })
      const data = await apiFetch<unknown[]>(`/api/profiles/search?${params}`)

      const nextProfiles = (data ?? [])
        .map(toSearchableProfile)
        .filter((profile): profile is SearchableProfile => profile !== null)
        .filter((profile) => isEligibleRole(profile.role))

      setProfiles(nextProfiles)
    } catch (err) {
      console.error('Error searching profiles:', err)
      setProfiles([])
      setSearchError('Impossible de rechercher des profils pour le moment.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleEmailSearch = async () => {
    const trimmedEmail = emailQuery.trim()
    const requiredEmailError =
      trimmedEmail.length === 0
        ? 'Ajoutez un e-mail pour lancer la recherche.'
        : validateEmail(trimmedEmail)

    setEmailError(requiredEmailError)
    setNameError(null)
    setActionMessage(null)
    setSearchError(null)

    if (requiredEmailError) return

    await runSearch('email', normalizeEmail(trimmedEmail))
  }

  const handleNameSearch = async () => {
    const normalizedName = normalizeFullName(nameQuery) ?? ''
    const nextNameError = validateProfileSearchName(nameQuery)

    setNameError(nextNameError)
    setEmailError(null)
    setActionMessage(null)
    setSearchError(null)

    if (nextNameError) return

    await runSearch('name', normalizedName)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
          <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Gerer les utilisateurs
              </h1>
              <p className="text-sm text-stone-500 sm:text-base">
                Verification de vos acces.
              </p>
            </div>

            <div className="grid gap-5 pt-6 lg:grid-cols-2">
              {[0, 1].map((item) => (
                <div
                  className="h-44 animate-pulse rounded-[1.75rem] border border-stone-200 bg-stone-50/80"
                  key={item}
                />
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to={loginPath} />
  }

  if (role !== 'super_admin') {
    return <Navigate replace to="/profile" />
  }

  const handleDeleteProfile = async (values: Record<string, string>) => {
    if (!profileToDelete) return

    const targetProfile = profileToDelete
    setDeleteErrorMessage(null)

    try {
      await deleteAccount.mutateAsync({
        requesterEmail: values.requesterEmail,
        targetEmail: values.targetEmail,
        targetUserId: targetProfile.id,
      })
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de supprimer ce compte pour le moment.',
      )
      return
    }

    setProfiles((currentProfiles) =>
      currentProfiles.filter((profile) => profile.id !== targetProfile.id),
    )
    setActionMessage('Le compte a ete supprime.')
    setDeleteErrorMessage(null)
    setProfileToDelete(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-[0_24px_60px_rgba(17,17,17,0.08)] backdrop-blur md:p-7">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-stone-200 pb-6">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Gerer les utilisateurs
              </h1>
              <p className="text-sm text-stone-500 sm:text-base">
                Recherchez un profil par e-mail ou par nom.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <SearchCard
                buttonLabel="Rechercher par e-mail"
                errorMessage={emailError}
                iconLabel="Recherche"
                inputLabel="E-mail exact"
                inputName="manage-users-email"
                isBusy={isSearching && activeSearchMode === 'email'}
                onChange={(value) => {
                  setEmailQuery(value)
                  setEmailError(null)
                }}
                onSubmit={handleEmailSearch}
                placeholder="nom@exemple.com"
                value={emailQuery}
              />

              <SearchCard
                buttonLabel="Rechercher par nom"
                errorMessage={nameError}
                iconLabel="Recherche"
                inputLabel="Nom"
                inputName="manage-users-name"
                isBusy={isSearching && activeSearchMode === 'name'}
                onChange={(value) => {
                  setNameQuery(value)
                  setNameError(null)
                }}
                onSubmit={handleNameSearch}
                placeholder="Nom a rechercher"
                value={nameQuery}
              />
            </div>

            {searchError ? (
              <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 px-5 py-6 text-sm text-stone-700">
                {searchError}
              </div>
            ) : null}

            {!searchError && actionMessage ? (
              <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 px-5 py-6 text-sm text-stone-700">
                {actionMessage}
              </div>
            ) : null}

            {!searchError && hasSearched && profiles.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-sm text-stone-600">
                Aucun profil eligible ne correspond a cette recherche.
              </div>
            ) : null}

            {profiles.length > 0 ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_18px_40px_rgba(17,17,17,0.05)]">
                <div className="divide-y divide-stone-200">
                  {profiles.map((profile) => (
                    <article
                      className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                      key={profile.id}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <img
                          alt={`Avatar de ${getDisplayName(profile)}`}
                          className="h-12 w-12 shrink-0 rounded-full border border-stone-300 bg-stone-100 object-cover"
                          src={getAvatarSrc(profile.avatar_url)}
                        />

                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-stone-950">
                              {getDisplayName(profile)}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadgeClassName(
                                profile.role,
                              )}`}
                            >
                              {getRoleLabel(profile.role)}
                            </span>
                          </div>

                          <p className="truncate text-sm text-stone-600">
                            {profile.email}
                          </p>

                          <p className="text-sm text-stone-500">
                            {formatMemberSinceDate(profile.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          aria-label="Supprimer le compte"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-950 transition hover:-translate-y-0.5 hover:border-stone-950 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-300"
                          onClick={() => {
                            setActionMessage(null)
                            setDeleteErrorMessage(null)
                            setProfileToDelete(profile)
                          }}
                          title="Supprimer le compte"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        </button>

                        <button
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-300 bg-stone-100 px-5 py-2.5 text-sm font-medium text-stone-500 opacity-70"
                          disabled
                          type="button"
                        >
                          {getChangeRoleLabel(profile.role)}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <AccountDeletionDialog
        confirmationDescription="Saisissez les deux e-mails pour continuer."
        confirmationTitle="Confirmer les adresses"
        errorMessage={deleteErrorMessage}
        fields={[
          {
            autoComplete: 'email',
            expectedValue: user.email ?? '',
            id: 'requesterEmail',
            invalidMessage: 'Cette adresse ne correspond pas.',
            label: 'Votre e-mail',
            placeholder: 'vous@exemple.com',
            requiredMessage: 'Saisissez votre e-mail.',
          },
          {
            expectedValue: profileToDelete?.email ?? '',
            id: 'targetEmail',
            invalidMessage: "L'adresse du compte ne correspond pas.",
            label: 'E-mail du compte',
            placeholder: 'nom@exemple.com',
            requiredMessage: "Saisissez l'e-mail du compte.",
          },
        ]}
        loading={deleteAccount.isPending}
        onClose={() => {
          setDeleteErrorMessage(null)
          setProfileToDelete(null)
        }}
        onConfirm={handleDeleteProfile}
        open={profileToDelete !== null}
        warningDescription="Cette action est irréversible."
        warningTitle="Supprimer ce compte ?"
      />

      <Footer />
    </div>
  )
}

export default ManageUsers
