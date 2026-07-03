import Elysia, { t } from 'elysia'
import { authMiddleware } from '../middleware/auth'
import { supabase as anonClient } from '../lib/supabase'
import { postService } from '../services/posts/post.service'
import type { CreatePostPayload, UpdatePostPayload } from '../services/posts/post.service'

export const postsRoutes = new Elysia({ prefix: '/api/posts' })

  // ── Public routes (no JWT required) ───────────────────────────────────────

  // GET /api/posts/published — published posts only (readable by guests)
  .get('/published', async ({ error }) => {
    try {
      return await postService.getPublished(anonClient)
    } catch (err) {
      return {
        "error": error(500, { message: 'Impossible de charger les publications.' }),
        "data": err
      }
    }
  })

  // GET /api/posts/:id — single post by id (readable by guests)
  .get(
    '/:id',
    async ({ params, error }) => {
      try {
        return await postService.getById(params.id, anonClient)
      } catch {
        return error(404, { message: 'Publication introuvable.' })
      }
    },
    { params: t.Object({ id: t.String() }) },
  )

  // ── Authenticated routes ───────────────────────────────────────────────────
  .use(authMiddleware)

  // GET /api/posts/all — all posts regardless of status (admins)
  .get('/all', async ({ userClient, error }) => {
    try {
      return await postService.getAll(userClient)
    } catch (err) {
      return error(500, { message: 'Impossible de charger les publications.' })
    }
  })

  // GET /api/posts/author/:authorId — posts by a specific author
  .get(
    '/author/:authorId',
    async ({ params, userClient, error }) => {
      try {
        return await postService.getByAuthor(params.authorId, userClient)
      } catch {
        return error(500, { message: 'Impossible de charger les publications.' })
      }
    },
    { params: t.Object({ authorId: t.String() }) },
  )

  // POST /api/posts — create a new post
  .post(
    '/',
    async ({ body, userId, userClient, error }) => {
      try {
        return await postService.create(body as CreatePostPayload, userId, userClient)
      } catch (err) {
        return error(400, { message: err instanceof Error ? err.message : 'Erreur lors de la création.' })
      }
    },
    {
      body: t.Object({
        content_type: t.Union([t.Literal('video'), t.Literal('audio'), t.Literal('blogpost')]),
        title: t.String(),
        description: t.Optional(t.String()),
        media_url: t.Optional(t.String()),
        text_content: t.Optional(t.Any()),
        status: t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')]),
      }),
    },
  )

  // PUT /api/posts/:id — update an existing post
  .put(
    '/:id',
    async ({ params, body, userClient, error }) => {
      try {
        const payload: UpdatePostPayload = { id: params.id, ...(body as Omit<UpdatePostPayload, 'id'>) }
        return await postService.update(payload, userClient)
      } catch (err) {
        return error(400, { message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour.' })
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.Nullable(t.String())),
        media_url: t.Optional(t.Nullable(t.String())),
        text_content: t.Optional(t.Nullable(t.Any())),
        status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')])),
      }),
    },
  )

  // DELETE /api/posts/:id — delete a post
  .delete(
    '/:id',
    async ({ params, userClient, error }) => {
      try {
        await postService.delete(params.id, userClient)
        return { success: true }
      } catch {
        return error(400, { message: 'Impossible de supprimer la publication.' })
      }
    },
    { params: t.Object({ id: t.String() }) },
  )
