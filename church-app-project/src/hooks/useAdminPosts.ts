import { useQuery } from '@tanstack/react-query'
import { postService } from '@/services/delete/posts/post.service'

export const useAdminPosts = () =>
  useQuery({
    queryKey: ['posts', 'all'],
    queryFn: () => postService.getAll(),
  })
