import Elysia from 'elysia'
import { createUserClient, supabase } from '../lib/supabase'

// Step 1 — extract token and resolve user from the Authorization header.
// Returns nullable values so public routes can still use this without failing.
// Never throws — leaves enforcement to onBeforeHandle below.
const extractAuth = new Elysia({ name: 'auth-extract' }).derive(
  { as: 'global' },
  async ({ headers }) => {
    const authHeader = headers['authorization'] ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) return { userId: null, userEmail: null, userClient: null }

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) return { userId: null, userEmail: null, userClient: null }

    return {
      userId: data.user.id,
      userEmail: data.user.email ?? '',
      userClient: createUserClient(token),
    }
  },
)

// Step 2 — enforce authentication. Only use this on protected routes.
// Placed in onBeforeHandle so it can legitimately return an HTTP 401.
export const authMiddleware = new Elysia({ name: 'auth' })
  .use(extractAuth)
  .onBeforeHandle({ as: 'scoped' }, ({ userId, status }) => {
    if (!userId) return status(401, { message: 'Authentification requise.' })
  })
