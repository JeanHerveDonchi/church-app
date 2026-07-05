import Elysia, { t } from 'elysia'
import { authMiddleware } from '../middleware/auth'
import { sendWelcomeEmail } from '../lib/email'
import {
  checkAccountLifecycle,
  fetchProfileByEmail,
  fetchProfileByUserId,
  recreateMissingProfile,
  resolveAccountLifecycle,
} from '../services/lifecycle.service'

export const lifecycleRoutes = new Elysia({ prefix: '/api/lifecycle' })

  // GET /api/lifecycle/by-email/:email
  // Public — called before login to detect self-deleted accounts for the recovery prompt
  .get(
    '/by-email/:email',
    async ({ params }) => {
      const profile = await fetchProfileByEmail(decodeURIComponent(params.email))
      return checkAccountLifecycle(profile)
    },
    { params: t.Object({ email: t.String() }) },
  )

  // Auth-required routes below
  .use(authMiddleware)

  // GET /api/lifecycle/user/:userId
  // Resolve full lifecycle state for a given userId (used by frontend hooks)
  .get(
    '/user/:userId',
    async ({ params, userClient }) => {
      return resolveAccountLifecycle(params.userId, userClient)
    },
    { params: t.Object({ userId: t.String() }) },
  )

  // POST /api/lifecycle/ensure-profile
  // Auto-recreate a missing profile (anomaly recovery)
  .post(
    '/ensure-profile',
    async ({ body, userClient, error }) => {
      const result = await recreateMissingProfile(body.userId, body.email, userClient)

      if (!result.success) {
        return error(500, { message: 'Impossible de recréer le profil.' })
      }

      return result.profile
    },
    {
      body: t.Object({
        userId: t.String(),
        email: t.String(),
      }),
    },
  )

  // GET /api/lifecycle/:userId/auth-state
  // Returns { isDeleted, role, deletionType } — used by authProvider
  .get(
    '/:userId/auth-state',
    async ({ params, userClient }) => {
      const { data, error: dbError } = await userClient
        .from('profiles')
        .select('deleted_at, deletion_type, role:roles!profiles_role_id_fkey(name)')
        .eq('id', params.userId)
        .maybeSingle()

      if (dbError) {
        console.error('Error fetching auth state:', dbError)
        return { isDeleted: false, role: null, deletionType: null }
      }

      const profile = data as {
        deleted_at: string | null
        deletion_type: string | null
        role: { name: string | null } | null
      } | null

      if (!profile) return { isDeleted: false, role: null, deletionType: null }

      if (profile.deleted_at) {
        return {
          isDeleted: true,
          role: null,
          deletionType: profile.deletion_type ?? null,
        }
      }

      const roleName = profile.role?.name ?? null
      const validRole =
        roleName === 'user' || roleName === 'admin' || roleName === 'super_admin'
          ? roleName
          : null

      return { isDeleted: false, role: validRole, deletionType: null }
    },
    { params: t.Object({ userId: t.String() }) },
  )

  // POST /api/lifecycle/send-welcome
  // Fire-and-forget welcome email — called when a new user first authenticates
  .post(
    '/send-welcome',
    async ({ body }) => {
      sendWelcomeEmail(body.email)
      return { ok: true }
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    },
  )
