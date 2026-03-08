import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { defaultSiteFeatureBannerSettings } from '@/lib/siteFeatureBanner'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

const SETTINGS_DOC_PATH = 'siteSettings/featureBanner'

type FeatureBannerPayload = {
  imageDataUrl?: string
  linkUrl?: string
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'any')
    const adminDb = getFirebaseAdminDb()
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
