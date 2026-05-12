import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postService } from '@/services/delete/posts/post.service'

export const useDeletePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => postService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
