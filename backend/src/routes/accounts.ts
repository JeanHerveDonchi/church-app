import Elysia, { t } from 'elysia'
import { sendEmail } from '../lib/email'
import { accountDeletedTemplate } from '../templates/account-deleted'
import { accountDisabledTemplate } from '../templates/account-disabled'
import { accountRecoveredTemplate } from '../templates/account-recovered'
import { authMiddleware } from '../middleware/auth'
import { deleteAccount, getDeleteErrorMessage } from '../services/accounts/delete.service'
import { getRecoveryErrorMessage, recoverAccount } from '../services/recovery.service'

export const accountsRoutes = new Elysia({ prefix: '/api/accounts' })
  .use(authMiddleware)

  // POST /api/accounts/delete
  // Self-delete: { requesterEmail }
  // Admin-delete: { requesterEmail, targetUserId, targetEmail }
  .post(
    '/delete',
    async ({ body, userClient, error }) => {
      const result = await deleteAccount(body, userClient)

      if (!result.success) {
        return error(400, {
          message: getDeleteErrorMessage(result.error ?? 'Unknown error'),
        })
      }

      // Determine which email to send based on whether this is self-delete or admin-delete.
      // Fire-and-forget: email failure never blocks the response.
      if (body.targetEmail) {
        // Admin deleted someone else — notify the target
        const { subject, html } = accountDisabledTemplate()
        sendEmail({ to: body.targetEmail, subject, html })
      } else {
        // User deleted themselves — notify them
        const { subject, html } = accountDeletedTemplate()
        sendEmail({ to: body.requesterEmail, subject, html })
      }

      return { success: true }
    },
    {
      body: t.Object({
        requesterEmail: t.String(),
        targetUserId: t.Optional(t.Nullable(t.String())),
        targetEmail: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // POST /api/accounts/recover
  // Restore a self-deleted account for the authenticated user
  .post(
    '/recover',
    async ({ body, userClient, userEmail, error }) => {
      const resolvedEmail = body.email ?? userEmail

      const result = await recoverAccount(body.userId, resolvedEmail, userClient)

      if (!result.success) {
        return error(400, {
          message: getRecoveryErrorMessage(result.error ?? 'Unknown error'),
        })
      }

      // Notify the user their account is restored
      const { subject, html } = accountRecoveredTemplate()
      sendEmail({ to: resolvedEmail, subject, html })

      return { success: true }
    },
    {
      body: t.Object({
        userId: t.String(),
        email: t.Optional(t.String()),
      }),
    },
  )
