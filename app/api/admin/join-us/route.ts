import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'
import { normalizeJoinUsSettings } from '@/lib/joinUs'

export const runtime = 'nodejs'

type JoinUsSettingsPayload = {
  headerText?: string
  subheaderText?: string
  headerImageDataUrl?: string
  fields?: Array<{
    id?: string
    label?: string
    type?: string
    required?: boolean
    options?: string[]
  }>
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'any')
    const adminDb = getFirebaseAdminDb()

    const [settingsSnap, appsSnap] = await Promise.all([
      adminDb.doc('siteSettings/joinUsForm').get(),
      adminDb.collection('joinUsApplications').limit(500).get(),
    ])

    const settings = normalizeJoinUsSettings(
      settingsSnap.exists ? (settingsSnap.data() as Record<string, unknown>) : undefined,
    )

    const applications = (appsSnap.docs
      .map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() as Record<string, unknown>),
      })) as Array<{ id: string; createdAt?: number } & Record<string, unknown>>)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))

    return NextResponse.json({ settings, applications })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load recruitment data.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'any')
    const adminDb = getFirebaseAdminDb()
    const payload = (await request.json()) as JoinUsSettingsPayload

    const settings = normalizeJoinUsSettings({
      headerText: payload.headerText,
      subheaderText: payload.subheaderText,
      headerImageDataUrl: payload.headerImageDataUrl,
      fields: payload.fields,
    })

    await adminDb.doc('siteSettings/joinUsForm').set(
      {
        ...settings,
        updatedAt: Date.now(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update recruitment form.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
