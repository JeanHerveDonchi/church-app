import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/authProvider'
import { postService } from '@/services/delete/posts/post.service'
import type { CreatePostPayload } from '@/types/post.types'

export const useCreatePost = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      if (!user) {
        throw new Error('You must be signed in to create a post.')
      }

      return postService.create(payload, user.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
