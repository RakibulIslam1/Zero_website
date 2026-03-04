import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

type DeleteUserPayload = {
  uid?: string
  email?: string
}

export async function POST(request: Request) {
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
      return NextResponse.json({ error: 'Only admin users can delete accounts.' }, { status: 403 })
    }

    const { uid, email } = (await request.json()) as DeleteUserPayload

    if (!uid) {
      return NextResponse.json({ error: 'Missing target uid.' }, { status: 400 })
    }

    if ((email || '').toLowerCase() === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Super admin account cannot be deleted.' }, { status: 400 })
    }

    await Promise.all([
      adminDb.doc(`profiles/${uid}`).delete().catch(() => undefined),
      adminDb.doc(`userRegistrations/${uid}`).delete().catch(() => undefined),
    ])

    try {
      await adminAuth.deleteUser(uid)
    } catch (authDeleteError) {
      const code = (authDeleteError as { code?: string })?.code || ''
      if (code !== 'auth/user-not-found') {
        throw authDeleteError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user account.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
