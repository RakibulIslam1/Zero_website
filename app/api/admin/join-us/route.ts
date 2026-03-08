import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { normalizeJoinUsSettings } from '@/lib/joinUs'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

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
    throw new Error('Only admin users can access recruitment data.')
  }

  return { adminDb }
}

export async function GET(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)

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

export async function POST(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
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
