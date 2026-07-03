import Elysia, { t } from 'elysia'
import { authMiddleware } from '../middleware/auth'
import { supabase as anonClient } from '../lib/supabase'
import { commentsService } from '../services/comments/comments.service'

export const commentsRoutes = new Elysia({ prefix: '/api/comments' })

  // GET /api/comments/post/:postId — comments for a post (readable by guests)
  .get(
    '/post/:postId',
    async ({ params, error }) => {
      try {
        return await commentsService.getByPostId(params.postId, anonClient)
      } catch {
        return error(500, { message: 'Impossible de charger les commentaires.' })
      }
    },
    { params: t.Object({ postId: t.String() }) },
  )

  // ── Authenticated routes ───────────────────────────────────────────────────
  .use(authMiddleware)

  // POST /api/comments — create a comment
  .post(
    '/',
    async ({ body, userId, userClient, error }) => {
      try {
        return await commentsService.create(body, userId, userClient)
      } catch (err) {
        return error(400, { message: err instanceof Error ? err.message : 'Erreur lors de la création.' })
      }
    },
    {
      body: t.Object({
        post_id: t.String(),
        content: t.String(),
      }),
    },
  )

  // DELETE /api/comments/:id — delete a comment
  .delete(
    '/:id',
    async ({ params, userClient, error }) => {
      try {
        await commentsService.delete(params.id, userClient)
        return { success: true }
      } catch {
        return error(400, { message: 'Impossible de supprimer le commentaire.' })
      }
    },
    { params: t.Object({ id: t.String() }) },
  )
