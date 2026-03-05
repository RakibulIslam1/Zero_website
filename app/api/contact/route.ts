import { NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

type ContactPayload = {
  name?: string
  email?: string
  subject?: string
  message?: string
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

    const adminDb = getFirebaseAdminDb()
    await adminDb.collection('contactMessages').add({
      name,
      email,
      subject,
      message,
      createdAt: Date.now(),
      status: 'new',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send contact message.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
