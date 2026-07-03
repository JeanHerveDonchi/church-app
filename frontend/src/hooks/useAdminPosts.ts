import { useQuery } from '@tanstack/react-query'
import { postService } from '@/services/posts/post.service'

export const useAdminPosts = () =>
  useQuery({
    queryKey: ['posts', 'all'],
    queryFn: () => postService.getAll(),
  })
