import { NextResponse } from 'next/server'
const nodemailer = require('nodemailer')

export const runtime = 'nodejs'

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

    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || user

    if (!host || !user || !pass || !from) {
      return NextResponse.json(
        { error: 'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.' },
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
