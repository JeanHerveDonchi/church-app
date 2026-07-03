import type { SupabaseClient } from '@supabase/supabase-js'

export type ContentType = 'video' | 'audio' | 'blogpost'
export type PostStatus = 'draft' | 'published' | 'archived'

export interface PostAuthor {
  id: string
  email: string | null
  deleted_at: string | null
  full_name: string | null
  avatar_url: string | null
}

export interface TypedPost {
  id: string
  title: string
  description: string | null
  content_type: ContentType
  status: PostStatus
  author: PostAuthor | null
  media_url: string | null
  text_content: unknown | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export type CreatePostPayload = {
  content_type: ContentType
  title: string
  description?: string
  media_url?: string
  text_content?: unknown
  status: PostStatus
}

export type UpdatePostPayload = {
  id: string
  title?: string
  description?: string
  media_url?: string | null
  text_content?: unknown | null
  status?: PostStatus
}

const POST_SELECT = `
  id, title, description, media_url, text_content,
  created_at, updated_at, published_at,
  content_types ( name ),
  post_statuses ( name ),
  profiles ( id, full_name, avatar_url, deleted_at )
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPost = (row: any): TypedPost => ({
  id: row.id,
  title: row.title,
  description: row.description,
  content_type: row.content_types.name,
  status: row.post_statuses.name,
  media_url: row.media_url,
  text_content: row.text_content,
  published_at: row.published_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
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

export const postService = {
  async getPublished(client: SupabaseClient): Promise<TypedPost[]> {
    const { data, error } = await client
      .from('posts')
      .select(POST_SELECT)
      .order('published_at', { ascending: false })
    if (error) throw error
    return data.map(toPost).filter((p) => p.status === 'published')
  },

  async getByAuthor(authorId: string, client: SupabaseClient): Promise<TypedPost[]> {
    const { data, error } = await client
      .from('posts')
      .select(POST_SELECT)
      .eq('author_id', authorId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data.map(toPost)
  },

  async getAll(client: SupabaseClient): Promise<TypedPost[]> {
    const { data, error } = await client
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(toPost)
  },

  async getById(id: string, client: SupabaseClient): Promise<TypedPost> {
    const { data, error } = await client
      .from('posts')
      .select(POST_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return toPost(data)
  },

  async create(
    payload: CreatePostPayload,
    authorId: string,
    client: SupabaseClient,
  ): Promise<TypedPost> {
    const { data: ctData } = await client
      .from('content_types')
      .select('id')
      .eq('name', payload.content_type)
      .single()

    const { data: stData } = await client
      .from('post_statuses')
      .select('id')
      .eq('name', payload.status)
      .single()

    const { data, error } = await client
      .from('posts')
      .insert({
        author_id: authorId,
        content_type_id: ctData!.id,
        status_id: stData!.id,
        title: payload.title,
        description: payload.description ?? null,
        media_url: payload.media_url ?? null,
        text_content: payload.text_content ?? null,
      })
      .select(POST_SELECT)
      .single()

    if (error) throw error
    return toPost(data)
  },

  async update(payload: UpdatePostPayload, client: SupabaseClient): Promise<TypedPost> {
    const { id, ...rest } = payload
    const updates: Record<string, unknown> = {}

    if ('title' in rest) updates.title = rest.title
    if ('description' in rest) updates.description = rest.description ?? null

    if (rest.status) {
      const { data: stData } = await client
        .from('post_statuses')
        .select('id')
        .eq('name', rest.status)
        .single()
      updates.status_id = stData!.id
      if (rest.status === 'published') updates.published_at = new Date().toISOString()
    }

    if ('media_url' in rest) updates.media_url = rest.media_url ?? null
    if ('text_content' in rest) updates.text_content = rest.text_content ?? null

    const { data, error } = await client
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select(POST_SELECT)
      .single()

    if (error) throw error
    return toPost(data)
  },

  async delete(id: string, client: SupabaseClient): Promise<void> {
    const { error } = await client.from('posts').delete().eq('id', id)
    if (error) throw error
  },
}
