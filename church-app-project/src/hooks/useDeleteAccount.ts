import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deleteAccount,
  type DeleteAccountPayload,
} from '@/services/accounts/delete.service'

export const useDeleteAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DeleteAccountPayload) => deleteAccount(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['comments'] }),
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ])
    },
  })
}
