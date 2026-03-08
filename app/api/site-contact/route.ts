import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { defaultSiteContactSettings } from '@/lib/siteContact'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

const SETTINGS_DOC_PATH = 'siteSettings/contact'

type ContactSettingsPayload = {
  address?: string
  phones?: string[]
  email?: string
  officeHours?: string
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'any')
    const adminDb = getFirebaseAdminDb()
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
