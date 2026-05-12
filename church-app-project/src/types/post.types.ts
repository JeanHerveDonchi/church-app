export type ContentType = 'video' | 'audio' | 'blogpost'
export type PostStatus = 'draft' | 'published' | 'archived'

export interface TipTapContent {
  type: 'doc'
  content: TipTapNode[]
}

export interface TipTapNode {
  type: string
  attrs?:   Record<string, unknown>
  content?: TipTapNode[]
  marks?:   TipTapMark[]
  text?:    string
}

export interface TipTapMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface PostAuthor {
  id:         string
  email:      string | null
  full_name:  string | null
  avatar_url: string | null
}

export interface Post {
  id:           string
  title:        string
  description:  string | null
  content_type: ContentType
  status:       PostStatus
  author:       PostAuthor | null
  media_url:    string | null
  text_content: TipTapContent | null
  created_at:   string
  updated_at:   string
  published_at: string | null
}

export interface VideoPost extends Post {
  content_type: 'video'
  media_url:    string
  text_content: null
}

export interface AudioPost extends Post {
  content_type: 'audio'
  media_url:    string
  text_content: null
}

export interface ArticlePost extends Post {
  content_type: 'blogpost'
  media_url:    null
  text_content: TipTapContent
}

export type TypedPost = VideoPost | AudioPost | ArticlePost

export const isVideoPost   = (p: Post): p is VideoPost   => p.content_type === 'video'
export const isAudioPost   = (p: Post): p is AudioPost   => p.content_type === 'audio'
export const isArticlePost = (p: Post): p is ArticlePost => p.content_type === 'blogpost'

export interface CreateVideoPostPayload {
  content_type: 'video'
  title:        string
  description?: string
  media_url:    string
  status:       PostStatus
}

export interface CreateAudioPostPayload {
  content_type: 'audio'
  title:        string
  description?: string
  media_url:    string
  status:       PostStatus
}

export interface CreateArticlePostPayload {
  content_type: 'blogpost'
  title:        string
  description?: string
  text_content: TipTapContent
  status:       PostStatus
}

export type CreatePostPayload =
  | CreateVideoPostPayload
  | CreateAudioPostPayload
  | CreateArticlePostPayload

export type UpdatePostPayload = {
  id: string
  title?: string
  description?: string
  media_url?: string | null
  text_content?: TipTapContent | null
  status?: PostStatus
}

export interface Comment {
  id:         string
  post_id:    string
  content:    string
  created_at: string
  author:     PostAuthor | null
}

export interface CreateCommentPayload {
  post_id: string
  content: string
}
