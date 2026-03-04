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

    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(token)
    } catch (verifyError) {
      const message = verifyError instanceof Error ? verifyError.message : 'Failed to verify admin token.'
      return NextResponse.json({ error: `Token verification failed: ${message}` }, { status: 401 })
    }
    const requesterEmail = decoded.email?.toLowerCase() || ''

    if (!requesterEmail) {
      return NextResponse.json({ error: 'Unable to identify requester email.' }, { status: 403 })
    }

    let isAllowedAdmin = requesterEmail === SUPER_ADMIN_EMAIL
    if (!isAllowedAdmin) {
      try {
        const rolesDoc = await adminDb.doc('adminSettings/roles').get()
        const adminEmails = ((rolesDoc.data()?.emails as string[] | undefined) ?? []).map((entry) => entry.toLowerCase())
        isAllowedAdmin = adminEmails.includes(requesterEmail)
      } catch (rolesError) {
        const message = rolesError instanceof Error ? rolesError.message : 'Failed to verify admin roles.'
        return NextResponse.json({ error: `Role check failed: ${message}` }, { status: 500 })
      }
    }

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

    try {
      await Promise.all([
        adminDb.doc(`profiles/${uid}`).delete().catch(() => undefined),
        adminDb.doc(`userRegistrations/${uid}`).delete().catch(() => undefined),
      ])
    } catch (dbDeleteError) {
      const message = dbDeleteError instanceof Error ? dbDeleteError.message : 'Failed to delete Firestore account docs.'
      return NextResponse.json({ error: `Firestore delete failed: ${message}` }, { status: 500 })
    }

    try {
      await adminAuth.deleteUser(uid)
    } catch (authDeleteError) {
      const code = (authDeleteError as { code?: string })?.code || ''
      if (code !== 'auth/user-not-found') {
        const message = authDeleteError instanceof Error ? authDeleteError.message : 'Failed to delete auth user.'
        return NextResponse.json({ error: `Auth delete failed: ${message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user account.'
    const hint = message.includes('Firebase Admin SDK is not configured')
      ? ' Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in Vercel and redeploy.'
      : ''
    return NextResponse.json({ error: `${message}${hint}` }, { status: 500 })
  }
}
