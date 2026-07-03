import type { SupabaseClient } from '@supabase/supabase-js'

export interface Comment {
  id: string
  post_id: string
  content: string
  created_at: string
  author: {
    id: string
    email: string | null
    deleted_at: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

export interface CreateCommentPayload {
  post_id: string
  content: string
}

const COMMENT_SELECT =
  'id, content, created_at, post_id, profiles ( id, full_name, avatar_url, deleted_at )'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toComment = (row: any): Comment => ({
  id: row.id,
  post_id: row.post_id,
  content: row.content,
  created_at: row.created_at,
  author: row.profiles
    ? {
        id: row.profiles.id,
        email: null,
        deleted_at: row.profiles.deleted_at,
        full_name: row.profiles.full_name,
        avatar_url: row.profiles.avatar_url,
      }
    : null,
})

export const commentsService = {
  async getByPostId(postId: string, client: SupabaseClient): Promise<Comment[]> {
    const { data, error } = await client
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(toComment)
  },

  async create(
    payload: CreateCommentPayload,
    authorId: string,
    client: SupabaseClient,
  ): Promise<Comment> {
    const { data, error } = await client
      .from('comments')
      .insert({ post_id: payload.post_id, comment_author_id: authorId, content: payload.content })
      .select(COMMENT_SELECT)
      .single()
    if (error) throw error
    return toComment(data)
  },

  async delete(commentId: string, client: SupabaseClient): Promise<void> {
    const { error } = await client.from('comments').delete().eq('id', commentId)
    if (error) throw error
  },
}
