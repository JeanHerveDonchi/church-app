import { Resend } from 'resend'
import { welcomeTemplate } from '../templates/welcome'

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
  replyTo?: string
}

export const sendEmail = (params: SendEmailParams): void => {
  const resend = getClient()
  if (!resend) return

  const from = process.env.RESEND_FROM_EMAIL ?? 'THC Global <contact@thcglobal.com>'
  const replyTo = params.replyTo ?? process.env.RESEND_FROM_EMAIL ?? undefined

  resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo,
  }).catch((err) => {
    console.error('[email] Failed to send to', params.to, err)
  })
}

export const sendWelcomeEmail = (to: string): void => {
  const { subject, html } = welcomeTemplate()
  sendEmail({ to, subject, html })
}