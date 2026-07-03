import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postService } from '@/services/posts/post.service'
import type { UpdatePostPayload } from '@/types/post.types'

export const useUpdatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdatePostPayload) => postService.update(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
