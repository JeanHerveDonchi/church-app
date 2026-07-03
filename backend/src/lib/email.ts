import { Resend } from 'resend'

// Lazy-init so missing key at startup doesn't crash the server
let client: Resend | null = null

const getClient = (): Resend | null => {
  if (!process.env.RESEND_API_KEY) return null
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY)
  }
  return client
}

type SendEmailParams = {
  to: string
  subject: string
  html: string
}

// Fire-and-forget: logs on failure but never throws.
// Email errors must never block account operations.
export const sendEmail = (params: SendEmailParams): void => {
  const resend = getClient()
  if (!resend) return

  const from = process.env.RESEND_FROM_EMAIL ?? 'noreply@thcglobal.com'

  resend.emails.send({ from, to: params.to, subject: params.subject, html: params.html })
    .catch((err) => {
      console.error('[email] Failed to send to', params.to, err)
    })
}
