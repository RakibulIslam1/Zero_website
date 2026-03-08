import { NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { normalizeJoinUsSettings } from '@/lib/joinUs'

export const runtime = 'nodejs'

type JoinUsApplyPayload = {
  fullName?: string
  email?: string
  phone?: string
  photoDataUrl?: string
  answers?: Record<string, string>
}

export async function GET() {
  try {
    const adminDb = getFirebaseAdminDb()
    const settingsSnap = await adminDb.doc('siteSettings/joinUsForm').get()
    const settings = normalizeJoinUsSettings(
      settingsSnap.exists ? (settingsSnap.data() as Record<string, unknown>) : undefined,
    )

    return NextResponse.json({ settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Join Us settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as JoinUsApplyPayload
    const fullName = String(payload.fullName || '').trim()
    const email = String(payload.email || '').trim()
    const phone = String(payload.phone || '').trim()
    const photoDataUrl = String(payload.photoDataUrl || '').trim()
    const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {}

    if (!fullName || !email || !phone || !photoDataUrl) {
      return NextResponse.json({ error: 'Name, email, phone, and photo are required.' }, { status: 400 })
    }

    const adminDb = getFirebaseAdminDb()
    await adminDb.collection('joinUsApplications').add({
      fullName,
      email,
      phone,
      photoDataUrl,
      answers,
      createdAt: Date.now(),
      status: 'new',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit application.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
