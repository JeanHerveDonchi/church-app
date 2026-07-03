import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as anonClient } from '../lib/supabase'

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

export const fetchProfileByUserId = async (
  userId: string,
  client: SupabaseClient = anonClient,
): Promise<ProfileData | null> => {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile by user ID:', error)
    return null
  }

  return data as ProfileData | null
}

// Uses anon client intentionally — called before user is authenticated (email pre-check)
export const fetchProfileByEmail = async (
  email: string,
): Promise<ProfileData | null> => {
  if (!email) return null

  const { data, error } = await anonClient
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile by email:', error)
    return null
  }

  return data as ProfileData | null
}

export const checkAccountLifecycle = (
  profile: ProfileData | null,
): LifecycleCheckResult => {
  if (!profile) {
    return {
      state: 'missing_profile',
      profile: null,
      shouldBlockAccess: false,
      shouldShowRecovery: false,
      isDeleted: false,
    }
  }

  if (profile.deleted_at === null) {
    return {
      state: 'active',
      profile,
      shouldBlockAccess: false,
      shouldShowRecovery: false,
      isDeleted: false,
    }
  }

  if (profile.deletion_type === 'self_deleted') {
    return {
      state: 'self_deleted',
      profile,
      shouldBlockAccess: true,
      shouldShowRecovery: true,
      isDeleted: true,
    }
  }

  if (profile.deletion_type === 'admin_deleted') {
    return {
      state: 'admin_deleted',
      profile,
      shouldBlockAccess: true,
      shouldShowRecovery: false,
      isDeleted: true,
    }
  }

  return {
    state: 'unknown_error',
    profile,
    shouldBlockAccess: true,
    shouldShowRecovery: false,
    isDeleted: true,
  }
}

export const resolveAccountLifecycle = async (
  userId: string,
  client: SupabaseClient = anonClient,
): Promise<LifecycleCheckResult> => {
  const profile = await fetchProfileByUserId(userId, client)
  return checkAccountLifecycle(profile)
}

export const recreateMissingProfile = async (
  userId: string,
  email: string,
  client: SupabaseClient,
): Promise<{ success: boolean; profile: ProfileData | null }> => {
  const { error } = await client.rpc('ensure_user_profile', {
    user_id: userId,
    user_email: email,
  })

  if (error) {
    console.error('Error recreating missing profile:', error)
    return { success: false, profile: null }
  }

  const profile = await fetchProfileByUserId(userId, client)
  return { success: true, profile }
}
