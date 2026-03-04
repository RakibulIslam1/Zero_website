import { NextResponse } from 'next/server'
const nodemailer = require('nodemailer')

export const runtime = 'nodejs'

const DEFAULT_SMTP_HOST = 'smtp-relay.brevo.com'
const DEFAULT_SMTP_PORT = 587
const DEFAULT_SMTP_USER = 'rakibul.rir06@gmail.com'
const DEFAULT_SMTP_FROM = 'Zero Competitions <info.zerocomps@gmail.com>'

type ContactPayload = {
  name?: string
  email?: string
  subject?: string
  message?: string
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

function buildContactEmail(name: string, email: string, subject: string, message: string) {
  const fullSubject = `Contact Form: ${subject}`

  return {
    subject: fullSubject,
    text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `
      <h3>New contact form submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `,
  }
}

async function sendViaBrevoApi(params: {
  apiKey: string
  receiverEmail: string
  from: string
  name: string
  email: string
  subject: string
  message: string
}) {
  const { apiKey, receiverEmail, from, name, email, subject, message } = params
  const mail = buildContactEmail(name, email, subject, message)
  const sender = parseFromHeader(from)

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: receiverEmail, name: 'Zero Competitions Team' }],
      replyTo: { email, name },
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
    }),
  })

  if (!response.ok) {
    const fallbackText = await response.text()
    throw new Error(`Brevo API send failed (${response.status}): ${fallbackText || 'Unknown error'}`)
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactPayload

    const name = (payload.name || '').trim()
    const email = (payload.email || '').trim()
    const subject = (payload.subject || '').trim()
    const message = (payload.message || '').trim()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Please fill all required fields.' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
    }

    const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST
    const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT)
    const user = process.env.SMTP_USER || DEFAULT_SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || DEFAULT_SMTP_FROM
    const brevoApiKey = process.env.BREVO_API_KEY
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || DEFAULT_SMTP_USER

    if (!pass && !brevoApiKey) {
      return NextResponse.json({ error: 'Email is not configured. Set SMTP_PASS or BREVO_API_KEY.' }, { status: 500 })
    }

    const mail = buildContactEmail(name, email, subject, message)

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
          to: receiverEmail,
          replyTo: email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
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
        receiverEmail,
        from,
        name,
        email,
        subject,
        message,
      })

      return NextResponse.json({ success: true, provider: 'brevo-api' })
    }

    return NextResponse.json({ error: 'Failed to send contact message.' }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send contact message.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
