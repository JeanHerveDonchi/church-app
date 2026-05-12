import { useQuery } from '@tanstack/react-query'
import { postService } from '@/services/delete/posts/post.service'

export const usePublishedPosts = () =>
  useQuery({
    queryKey: ['posts', 'published'],
    queryFn: () => postService.getPublished(),
  })
