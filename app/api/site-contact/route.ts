import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { defaultSiteContactSettings } from '@/lib/siteContact'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'
const SETTINGS_DOC_PATH = 'siteSettings/contact'

type ContactSettingsPayload = {
  address?: string
  phones?: string[]
  email?: string
  officeHours?: string
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
    throw new Error('Only admin users can update contact settings.')
  }

  return { adminDb }
}

function normalizeSettings(data: Record<string, unknown> | undefined) {
  return {
    address: String(data?.address || defaultSiteContactSettings.address),
    phones: Array.isArray(data?.phones)
      ? data?.phones
          .map((phone) => String(phone || '').trim())
          .filter(Boolean)
      : defaultSiteContactSettings.phones,
    email: String(data?.email || defaultSiteContactSettings.email),
    officeHours: String(data?.officeHours || defaultSiteContactSettings.officeHours),
  }
}

export async function GET() {
  try {
    const adminDb = getFirebaseAdminDb()
    const snap = await adminDb.doc(SETTINGS_DOC_PATH).get()
    const data = snap.exists ? (snap.data() as Record<string, unknown>) : undefined

    return NextResponse.json({
      settings: normalizeSettings(data),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load contact settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const payload = (await request.json()) as ContactSettingsPayload

    const address = (payload.address || '').trim()
    const email = (payload.email || '').trim()
    const officeHours = (payload.officeHours || '').trim()
    const phones = Array.isArray(payload.phones)
      ? payload.phones.map((phone) => String(phone || '').trim()).filter(Boolean)
      : []

    if (!email || phones.length === 0 || !officeHours) {
      return NextResponse.json({ error: 'Email, at least one phone number, and office hours are required.' }, { status: 400 })
    }

    await adminDb.doc(SETTINGS_DOC_PATH).set(
      {
        address: address || defaultSiteContactSettings.address,
        phones,
        email,
        officeHours,
        updatedAt: Date.now(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update contact settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
