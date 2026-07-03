import { apiFetch } from '@/lib/api'
import type {
  TypedPost,
  CreatePostPayload,
  UpdatePostPayload,
} from '@/types/post.types'

export const postService = {

  async getPublished(): Promise<TypedPost[]> {
    return apiFetch<TypedPost[]>('/api/posts/published')
  },

  async getByAuthor(authorId: string): Promise<TypedPost[]> {
    return apiFetch<TypedPost[]>(`/api/posts/author/${authorId}`)
  },

  async getAll(): Promise<TypedPost[]> {
    return apiFetch<TypedPost[]>('/api/posts/all')
  },

  async getById(id: string): Promise<TypedPost> {
    return apiFetch<TypedPost>(`/api/posts/${id}`)
  },

  async create(payload: CreatePostPayload, _authorId: string): Promise<TypedPost> {
    return apiFetch<TypedPost>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async update(payload: UpdatePostPayload): Promise<TypedPost> {
    const { id, ...rest } = payload
    return apiFetch<TypedPost>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rest),
    })
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/api/posts/${id}`, { method: 'DELETE' })
  },
}
