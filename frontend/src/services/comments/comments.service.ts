import { apiFetch } from '@/lib/api'
import type { Comment, CreateCommentPayload } from '@/types/post.types'

export const commentsService = {

  async getByPostId(postId: string): Promise<Comment[]> {
    return apiFetch<Comment[]>(`/api/comments/post/${postId}`)
  },

  async create(payload: CreateCommentPayload, _authorId: string): Promise<Comment> {
    return apiFetch<Comment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async delete(commentId: string): Promise<void> {
    await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' })
  },
}
