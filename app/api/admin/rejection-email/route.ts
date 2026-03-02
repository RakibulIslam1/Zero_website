import { NextResponse } from 'next/server'
const nodemailer = require('nodemailer')

export const runtime = 'nodejs'

const DEFAULT_SMTP_HOST = 'smtp-relay.brevo.com'
const DEFAULT_SMTP_PORT = 587
const DEFAULT_SMTP_USER = 'rakibul.rir06@gmail.com'
const DEFAULT_SMTP_FROM = 'Zero Competitions <info.zerocomps@gmail.com>'

type RejectionEmailPayload = {
  to?: string
  fullName?: string
  reason?: string
}

function buildMessage(recipientName: string, reason: string) {
  return {
    subject: 'Zero Competitions verification update',
    text: `Hello ${recipientName},\n\nYour account verification has been cancelled.\nReason: ${reason}\n\nIf you believe this is a mistake, please contact the Zero Competitions team.`,
    html: `
      <p>Hello ${recipientName},</p>
      <p>Your account verification has been cancelled.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you believe this is a mistake, please contact the Zero Competitions team.</p>
    `,
  }
}

function parseFromHeader(from: string) {
  const matched = from.match(/^(.*)<(.+)>$/)
  if (!matched) {
    return { name: 'Zero Competitions', email: from.trim() }
  }

  return {
    name: matched[1].trim().replace(/^"|"$/g, '') || 'Zero Competitions',
    email: matched[2].trim(),
  }
}

async function sendViaBrevoApi(params: {
  apiKey: string
  to: string
  from: string
  recipientName: string
  reason: string
}) {
  const { apiKey, to, from, recipientName, reason } = params
  const message = buildMessage(recipientName, reason)
  const sender = parseFromHeader(from)

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to, name: recipientName }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
    }),
  })

  if (!response.ok) {
    const fallbackText = await response.text()
    throw new Error(`Brevo API send failed (${response.status}): ${fallbackText || 'Unknown error'}`)
  }
}

export async function POST(request: Request) {
  try {
    const { to, fullName, reason } = (await request.json()) as RejectionEmailPayload

    if (!to || !reason) {
      return NextResponse.json({ error: 'Missing recipient email or rejection reason.' }, { status: 400 })
    }

    const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST
    const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT)
    const user = process.env.SMTP_USER || DEFAULT_SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || DEFAULT_SMTP_FROM
    const brevoApiKey = process.env.BREVO_API_KEY
    const recipientName = fullName?.trim() || 'Participant'
    const message = buildMessage(recipientName, reason)

    if (!pass && !brevoApiKey) {
      return NextResponse.json({ error: 'Email is not configured. Set SMTP_PASS or BREVO_API_KEY.' }, { status: 500 })
    }

    if (pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        })

        await transporter.sendMail({
          from,
          to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        })

        return NextResponse.json({ success: true, provider: 'smtp' })
      } catch (smtpError) {
        const smtpMessage = smtpError instanceof Error ? smtpError.message : 'SMTP send failed.'
        const authFailed = smtpMessage.includes('535') || smtpMessage.toLowerCase().includes('authentication failed')
        if (!authFailed || !brevoApiKey) {
          throw smtpError
        }
      }
    }

    if (brevoApiKey) {
      await sendViaBrevoApi({
        apiKey: brevoApiKey,
        to,
        from,
        recipientName,
        reason,
      })

      return NextResponse.json({ success: true, provider: 'brevo-api' })
    }

    return NextResponse.json({ error: 'Failed to send rejection email.' }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send rejection email.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
