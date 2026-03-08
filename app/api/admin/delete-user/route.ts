import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

type DeleteUserPayload = {
  uid?: string
  email?: string
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'any')

    const adminAuth = getFirebaseAdminAuth()
    const adminDb = getFirebaseAdminDb()

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
