import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 })
    }

    const adminAuth = getFirebaseAdminAuth()
    const adminDb = getFirebaseAdminDb()

    const decoded = await adminAuth.verifyIdToken(token)
    const requesterEmail = decoded.email?.toLowerCase() || ''

    if (!requesterEmail) {
      return NextResponse.json({ error: 'Unable to identify requester email.' }, { status: 403 })
    }

    const rolesDoc = await adminDb.doc('adminSettings/roles').get()
    const adminEmails = ((rolesDoc.data()?.emails as string[] | undefined) ?? []).map((entry) => entry.toLowerCase())
    const isAllowedAdmin = requesterEmail === SUPER_ADMIN_EMAIL || adminEmails.includes(requesterEmail)

    if (!isAllowedAdmin) {
      return NextResponse.json({ error: 'Only admin users can view contact messages.' }, { status: 403 })
    }

    const snap = await adminDb.collection('contactMessages').orderBy('createdAt', 'desc').limit(200).get()
    const items = snap.docs.map((docItem) => ({
      id: docItem.id,
      ...(docItem.data() as {
        name?: string
        email?: string
        subject?: string
        message?: string
        createdAt?: number
        status?: string
      }),
    }))

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load contact messages.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
