import { useQuery } from '@tanstack/react-query'
import { postService } from '@/services/delete/posts/post.service'

export const usePosts = (authorId: string) =>
  useQuery({
    queryKey: ['posts', 'author', authorId],
    queryFn: () => postService.getByAuthor(authorId),
    enabled: authorId.length > 0,
  })
