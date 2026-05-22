import { supabase } from '@/providers/supabaseClient'

const SUPABASE_AUTH_STORAGE_PREFIX = 'sb-'
const SUPABASE_AUTH_STORAGE_SUFFIX = '-auth-token'

const clearSupabaseStorage = (storage: Storage | null | undefined) => {
  if (!storage) {
    return
  }

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)

    if (
      key?.startsWith(SUPABASE_AUTH_STORAGE_PREFIX) &&
      key.endsWith(SUPABASE_AUTH_STORAGE_SUFFIX)
    ) {
      storage.removeItem(key)
    }
  }
}

export const resetLocalSession = async () => {
  const result = await supabase.auth.signOut({
    scope: 'local',
  })

  if (typeof window !== 'undefined') {
    clearSupabaseStorage(window.localStorage)
    clearSupabaseStorage(window.sessionStorage)
  }

  return result
}
