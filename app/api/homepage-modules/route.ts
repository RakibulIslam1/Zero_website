import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import {
  defaultHomepageModulesSettings,
  normalizeHomepageModulesSettings,
} from '@/lib/homepageModules'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'
const SETTINGS_DOC_PATH = 'siteSettings/homepageModules'

type HomepageModulesPayload = {
  showStats?: boolean
  showPartners?: boolean
  partners?: Array<{
    id?: string
    name?: string
    imageDataUrl?: string
  }>
}

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''

  if (!token) {
    throw new Error('Missing authorization token.')
  }

  const adminAuth = getFirebaseAdminAuth()
  const adminDb = getFirebaseAdminDb()

  const decoded = await adminAuth.verifyIdToken(token)
  const requesterEmail = decoded.email?.toLowerCase() || ''

  if (!requesterEmail) {
    throw new Error('Unable to identify requester email.')
  }

  const rolesDoc = await adminDb.doc('adminSettings/roles').get()
  const adminEmails = ((rolesDoc.data()?.emails as string[] | undefined) ?? []).map((entry) => entry.toLowerCase())
  const isAllowedAdmin = requesterEmail === SUPER_ADMIN_EMAIL || adminEmails.includes(requesterEmail)

  if (!isAllowedAdmin) {
    throw new Error('Only admin users can update homepage modules settings.')
  }

  return { adminDb }
}

export async function GET() {
  try {
    const adminDb = getFirebaseAdminDb()
    const snap = await adminDb.doc(SETTINGS_DOC_PATH).get()
    const settings = snap.exists
      ? normalizeHomepageModulesSettings(snap.data() as Record<string, unknown>)
      : defaultHomepageModulesSettings

    return NextResponse.json({ settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load homepage modules settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const payload = (await request.json()) as HomepageModulesPayload

    const settings = normalizeHomepageModulesSettings({
      showStats: payload.showStats,
      showPartners: payload.showPartners,
      partners: payload.partners,
    })

    await adminDb.doc(SETTINGS_DOC_PATH).set(
      {
        ...settings,
        updatedAt: Date.now(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update homepage modules settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
