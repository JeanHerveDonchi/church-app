import { supabase } from '@/lib/supabase'
import type {
  TypedPost,
  CreatePostPayload,
  UpdatePostPayload,
} from '@/types/post.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPost = (row: any): TypedPost => ({
  id:           row.id,
  title:        row.title,
  description:  row.description,
  content_type: row.content_types.name,
  status:       row.post_statuses.name,
  media_url:    row.media_url,
  text_content: row.text_content,
  published_at: row.published_at,
  created_at:   row.created_at,
  updated_at:   row.updated_at,
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

const POST_SELECT = `
  id, title, description, media_url, text_content,
  created_at, updated_at, published_at,
  content_types ( name ),
  post_statuses ( name ),
  profiles ( id, full_name, avatar_url, deleted_at )
`

export const postService = {

  async getPublished(): Promise<TypedPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .order('published_at', { ascending: false })
    if (error) throw error
    return data.map(toPost).filter((post) => post.status === 'published')
  },

  async getByAuthor(authorId: string): Promise<TypedPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('author_id', authorId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data.map(toPost)
  },

  async getAll(): Promise<TypedPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(toPost)
  },

  async getById(id: string): Promise<TypedPost> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return toPost(data)
  },

  async create(payload: CreatePostPayload, authorId: string): Promise<TypedPost> {
    const { data: ctData } = await supabase
      .from('content_types')
      .select('id')
      .eq('name', payload.content_type)
      .single()

    const { data: stData } = await supabase
      .from('post_statuses')
      .select('id')
      .eq('name', payload.status)
      .single()

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id:       authorId,
        content_type_id: ctData!.id,
        status_id:       stData!.id,
        title:           payload.title,
        description:     payload.description ?? null,
        media_url:       'media_url' in payload ? payload.media_url : null,
        text_content:    'text_content' in payload ? payload.text_content : null,
      })
      .select(POST_SELECT)
      .single()

    if (error) throw error
    return toPost(data)
  },

  async update(payload: UpdatePostPayload): Promise<TypedPost> {
    const { id, ...rest } = payload
    const updates: Record<string, unknown> = {}

    if ('title' in rest) {
      updates.title = rest.title
    }

    if ('description' in rest) {
      updates.description = rest.description ?? null
    }

    if (rest.status) {
      const { data: stData } = await supabase
        .from('post_statuses')
        .select('id')
        .eq('name', rest.status)
        .single()
      updates.status_id = stData!.id
      if (rest.status === 'published') updates.published_at = new Date().toISOString()
    }

    if ('media_url' in rest) {
      updates.media_url = rest.media_url ?? null
    }

    if ('text_content' in rest) {
      updates.text_content = rest.text_content ?? null
    }

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select(POST_SELECT)
      .single()

    if (error) throw error
    return toPost(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw error
  },
}
