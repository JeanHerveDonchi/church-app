import { supabase } from '@/lib/supabase'
import type { Comment, CreateCommentPayload } from '@/types/post.types'

const COMMENT_SELECT =
  'id, content, created_at, post_id, profiles ( id, full_name, avatar_url, deleted_at )'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toComment = (row: any): Comment => ({
  id:         row.id,
  post_id:    row.post_id,
  content:    row.content,
  created_at: row.created_at,
  author: row.profiles
    ? {
        id:         row.profiles.id,
        email:      null,
        deleted_at: row.profiles.deleted_at,
        full_name:  row.profiles.full_name,
        avatar_url: row.profiles.avatar_url,
      }
    : null,
})

export const commentsService = {
  async getByPostId(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
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
  ): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: payload.post_id,
        comment_author_id: authorId,
        content: payload.content,
      })
      .select(COMMENT_SELECT)
      .single()

    if (error) throw error
    return toComment(data)
  },

  async delete(commentId: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) throw error
  },
}
