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

    if (!pass) {
      return NextResponse.json(
        { error: 'SMTP is not configured. Set SMTP_PASS (and optionally SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM).' },
        { status: 500 },
      )
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    })

    const recipientName = fullName?.trim() || 'Participant'

    await transporter.sendMail({
      from,
      to,
      subject: 'Zero Competitions verification update',
      text: `Hello ${recipientName},\n\nYour account verification has been cancelled.\nReason: ${reason}\n\nIf you believe this is a mistake, please contact the Zero Competitions team.`,
      html: `
        <p>Hello ${recipientName},</p>
        <p>Your account verification has been cancelled.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>If you believe this is a mistake, please contact the Zero Competitions team.</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send rejection email.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
