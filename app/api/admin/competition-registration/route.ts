import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { competitions } from '@/lib/competitions'
import {
  createDefaultCompetitionRegistrationSettings,
  normalizeCompetitionRegistrationSettings,
} from '@/lib/competitionRegistration'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

type SettingsPayload = {
  competitionId?: number
  headerText?: string
  subheaderText?: string
  fields?: Array<{
    id?: string
    label?: string
    type?: string
    required?: boolean
    options?: string[]
  }>
}

function parseCompetitionId(value: string | null): number | null {
  if (!value) return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  return numberValue
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
    throw new Error('Only admin users can access competition registration controls.')
  }

  return { adminDb }
}

export async function GET(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const competitionId = parseCompetitionId(searchParams.get('competitionId'))

    const applicationsSnap = competitionId
      ? await adminDb.collection('competitionRegistrationApplications').where('competitionId', '==', competitionId).get()
      : await adminDb.collection('competitionRegistrationApplications').limit(1000).get()

    const mappedApplications = applicationsSnap.docs.map((docItem) => ({
      id: docItem.id,
      ...(docItem.data() as Record<string, unknown>),
    }))
    const applications = (mappedApplications as Array<{ id: string; createdAt?: number } & Record<string, unknown>>)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))

    if (!competitionId) {
      return NextResponse.json({ applications })
    }

    const settingsDoc = await adminDb.doc(`competitionRegistrationForms/${competitionId}`).get()
    const settings = settingsDoc.exists
      ? normalizeCompetitionRegistrationSettings(competitionId, settingsDoc.data() as Record<string, unknown>)
      : createDefaultCompetitionRegistrationSettings(competitionId)

    return NextResponse.json({ settings, applications })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load competition registration admin data.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const payload = (await request.json()) as SettingsPayload
    const competitionId = Number(payload.competitionId)

    if (!Number.isFinite(competitionId)) {
      return NextResponse.json({ error: 'competitionId is required.' }, { status: 400 })
    }

    const competition = competitions.find((entry) => entry.id === competitionId)
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found.' }, { status: 404 })
    }

    const settings = normalizeCompetitionRegistrationSettings(competitionId, {
      headerText: payload.headerText,
      subheaderText: payload.subheaderText,
      fields: payload.fields,
    })

    await adminDb.doc(`competitionRegistrationForms/${competitionId}`).set(
      {
        ...settings,
        updatedAt: Date.now(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update competition registration settings.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
