import { useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsService } from '@/services/delete/comments/comments.service'

export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
    }: {
      commentId: string
      postId: string
    }) => commentsService.delete(commentId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['comments', variables.postId],
      })
    },
  })
}
