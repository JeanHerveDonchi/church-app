import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/authProvider'
import { commentsService } from '@/services/comments/comments.service'
import type { Comment, CreateCommentPayload } from '@/types/post.types'

export const useAddComment = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (payload: CreateCommentPayload) => {
      if (!user) {
        throw new Error('Vous devez etre connecte pour commenter.')
      }

      return commentsService.create(payload, user.id)
    },
    onSuccess: async (_comment: Comment, variables: CreateCommentPayload) => {
      await queryClient.invalidateQueries({
        queryKey: ['comments', variables.post_id],
      })
    },
  })
}
