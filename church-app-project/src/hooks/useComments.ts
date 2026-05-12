import { useQuery } from '@tanstack/react-query'
import { commentsService } from '@/services/delete/comments/comments.service'

export const useComments = (postId: string) =>
  useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentsService.getByPostId(postId),
    enabled: postId.length > 0,
  })
