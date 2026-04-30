import { supabase } from '../../providers/supabaseClient'

export async function deleteAccount(targetUserId?: string): Promise<boolean> {
  const { error } = await supabase.rpc('delete_account', {
    target_user_id: targetUserId ?? null,
  })

  if (error) {
    console.error('Error deleting account:', error)
    return false
  }

  return true
}
