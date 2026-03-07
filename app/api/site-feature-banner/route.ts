import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { defaultSiteFeatureBannerSettings } from '@/lib/siteFeatureBanner'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'
const SETTINGS_DOC_PATH = 'siteSettings/featureBanner'

type FeatureBannerPayload = {
  imageDataUrl?: string
  linkUrl?: string
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
    throw new Error('Only admin users can update feature banner settings.')
  }

  return { adminDb }
}

function normalizeSettings(data: Record<string, unknown> | undefined) {
  return {
    imageDataUrl: String(data?.imageDataUrl || defaultSiteFeatureBannerSettings.imageDataUrl),
    linkUrl: String(data?.linkUrl || defaultSiteFeatureBannerSettings.linkUrl),
  }
}

export async function GET() {
  try {
    const adminDb = getFirebaseAdminDb()
    const snap = await adminDb.doc(SETTINGS_DOC_PATH).get()
    const data = snap.exists ? (snap.data() as Record<string, unknown>) : undefined

    return NextResponse.json({ settings: normalizeSettings(data) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load feature banner settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const payload = (await request.json()) as FeatureBannerPayload

    const imageDataUrl = (payload.imageDataUrl || '').trim()
    const linkUrl = (payload.linkUrl || '').trim()

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'Banner image is required.' }, { status: 400 })
    }

    await adminDb.doc(SETTINGS_DOC_PATH).set(
      {
        imageDataUrl,
        linkUrl,
        updatedAt: Date.now(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update feature banner settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
