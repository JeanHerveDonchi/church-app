import { apiFetch } from '@/lib/api'

export type AccountLifecycleState =
  | 'active'
  | 'self_deleted'
  | 'admin_deleted'
  | 'missing_profile'
  | 'unknown_error'

export type ProfileData = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  deleted_at: string | null
  deletion_type: string | null
  deleted_auth_id: string | null
  role_id: string | null
  created_at: string
}

export type LifecycleCheckResult = {
  state: AccountLifecycleState
  profile: ProfileData | null
  shouldBlockAccess: boolean
  shouldShowRecovery: boolean
  isDeleted: boolean
}

// Pre-auth check — no JWT required, backend uses anon Supabase client
export const fetchProfileByEmail = async (
  email: string,
): Promise<LifecycleCheckResult | null> => {
  if (!email) return null
  try {
    return await apiFetch<LifecycleCheckResult>(
      `/api/lifecycle/by-email/${encodeURIComponent(email)}`,
    )
  } catch {
    return null
  }
}

// Post-auth: resolves lifecycle state for an authenticated user
export const resolveAccountLifecycle = async (
  userId: string,
): Promise<LifecycleCheckResult | null> => {
  try {
    return await apiFetch<LifecycleCheckResult>(`/api/lifecycle/user/${userId}`)
  } catch {
    return null
  }
}

// Auto-recreate a missing profile (anomaly recovery)
export const recreateMissingProfile = async (
  userId: string,
  email: string,
): Promise<{ success: boolean; profile: ProfileData | null; error: null }> => {
  try {
    const profile = await apiFetch<ProfileData>('/api/lifecycle/ensure-profile', {
      method: 'POST',
      body: JSON.stringify({ userId, email }),
    })
    return { success: true, profile, error: null }
  } catch {
    return { success: false, profile: null, error: null }
  }
}

// Local state check (no network) — kept for useAuthLifecycle compatibility
export const checkAccountLifecycle = (profile: ProfileData | null): LifecycleCheckResult => {
  if (!profile) {
    return { state: 'missing_profile', profile: null, shouldBlockAccess: false, shouldShowRecovery: false, isDeleted: false }
  }
  if (profile.deleted_at === null) {
    return { state: 'active', profile, shouldBlockAccess: false, shouldShowRecovery: false, isDeleted: false }
  }
  if (profile.deletion_type === 'self_deleted') {
    return { state: 'self_deleted', profile, shouldBlockAccess: true, shouldShowRecovery: true, isDeleted: true }
  }
  if (profile.deletion_type === 'admin_deleted') {
    return { state: 'admin_deleted', profile, shouldBlockAccess: true, shouldShowRecovery: false, isDeleted: true }
  }
  return { state: 'unknown_error', profile, shouldBlockAccess: true, shouldShowRecovery: false, isDeleted: true }
}

// Alias kept for callers using the old name
export const fetchProfileByUserId = async (userId: string) =>
  resolveAccountLifecycle(userId)

export const normalizeEmail = (email: string): string => email.toLowerCase().trim()
