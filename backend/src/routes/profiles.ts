import Elysia, { t } from 'elysia'
import { authMiddleware } from '../middleware/auth'

const PROFILE_FIELDS =
  'id, email, full_name, avatar_url, created_at, deleted_at, deletion_type, role_id'

const PROFILE_SEARCH_SELECT =
  'id, email, full_name, avatar_url, created_at, role:roles!profiles_role_id_fkey(name)'

export const profilesRoutes = new Elysia({ prefix: '/api/profiles' }).use(
  authMiddleware,
)

  // GET /api/profiles/me — fetch the authenticated user's profile
  .get('/me', async ({ userId, userClient, error }) => {
    const { data, error: dbError } = await userClient
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', userId)
      .maybeSingle()

    if (dbError) return error(500, { message: 'Impossible de charger votre profil.' })
    if (!data) return error(404, { message: 'Profil introuvable.' })

    return data
  })

  // PUT /api/profiles/me — update name or avatar
  .put(
    '/me',
    async ({ userId, userClient, body, error }) => {
      const { data, error: dbError } = await userClient
        .from('profiles')
        .update(body)
        .eq('id', userId)
        .select(PROFILE_FIELDS)
        .single()

      if (dbError) return error(400, { message: dbError.message })

      return data
    },
    {
      body: t.Object({
        full_name: t.Optional(t.Nullable(t.String())),
        avatar_url: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // GET /api/profiles/me/post-count — calls the get_my_post_count RPC
  .get('/me/post-count', async ({ userClient, error }) => {
    const { data, error: dbError } = await userClient.rpc('get_my_post_count')

    if (dbError) return error(500, { message: 'Impossible de charger le nombre de posts.' })

    return { count: Number(data) || 0 }
  })

  // GET /api/profiles/search?mode=email|name&q=<query>
  // Super-admin only: search profiles by email or name
  .get(
    '/search',
    async ({ query, userId, userClient, error }) => {
      if (!query.q || !query.mode) {
        return error(400, { message: 'Paramètres manquants.' })
      }

      const builder = userClient
        .from('profiles')
        .select(PROFILE_SEARCH_SELECT)
        .is('deleted_at', null)
        .neq('id', userId)
        .order('created_at', { ascending: false })

      const result =
        query.mode === 'email'
          ? await builder.ilike('email', query.q.toLowerCase().trim())
          : await builder.ilike('full_name', `%${query.q}%`)

      if (result.error) return error(500, { message: result.error.message })

      return result.data ?? []
    },
    {
      query: t.Object({
        mode: t.Optional(t.Union([t.Literal('email'), t.Literal('name')])),
        q: t.Optional(t.String()),
      }),
    },
  )
