import { useQuery } from '@tanstack/react-query'
import { postService } from '@/services/delete/posts/post.service'

export const usePost = (id: string) =>
  useQuery({
    queryKey: ['posts', id],
    queryFn: () => postService.getById(id),
    enabled: id.length > 0,
  })
