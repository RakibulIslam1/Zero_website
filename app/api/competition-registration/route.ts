import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { competitions } from '@/lib/competitions'
import {
  createDefaultCompetitionRegistrationSettings,
  normalizeCompetitionRegistrationSettings,
} from '@/lib/competitionRegistration'

export const runtime = 'nodejs'

type SubmitPayload = {
  competitionId?: number
  answers?: Record<string, unknown>
}

function parseCompetitionId(value: string | null): number | null {
  if (!value) return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  return numberValue
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const competitionId = parseCompetitionId(searchParams.get('competitionId'))

    if (!competitionId) {
      return NextResponse.json({ error: 'competitionId is required.' }, { status: 400 })
    }

    const adminDb = getFirebaseAdminDb()
    const settingsDoc = await adminDb.doc(`competitionRegistrationForms/${competitionId}`).get()
    const settings = settingsDoc.exists
      ? normalizeCompetitionRegistrationSettings(competitionId, settingsDoc.data() as Record<string, unknown>)
      : createDefaultCompetitionRegistrationSettings(competitionId)

    return NextResponse.json({ settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load competition registration form.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''

    if (!token) {
      return NextResponse.json({ error: 'You must be logged in to register.' }, { status: 401 })
    }

    const adminAuth = getFirebaseAdminAuth()
    const decoded = await adminAuth.verifyIdToken(token)
    const userId = decoded.uid
    const fullName = String(decoded.name || '').trim()
    const email = String(decoded.email || '').trim()

    if (!email) {
      return NextResponse.json({ error: 'Unable to identify your account email.' }, { status: 400 })
    }

    const payload = (await request.json()) as SubmitPayload
    const competitionId = Number(payload.competitionId)
    if (!Number.isFinite(competitionId)) {
      return NextResponse.json({ error: 'competitionId is required.' }, { status: 400 })
    }

    const competition = competitions.find((entry) => entry.id === competitionId)
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found.' }, { status: 404 })
    }

    if (competition.status === 'completed') {
      return NextResponse.json({ error: 'Registration is closed for this competition.' }, { status: 400 })
    }

    const adminDb = getFirebaseAdminDb()
    const settingsDoc = await adminDb.doc(`competitionRegistrationForms/${competitionId}`).get()
    const settings = settingsDoc.exists
      ? normalizeCompetitionRegistrationSettings(competitionId, settingsDoc.data() as Record<string, unknown>)
      : createDefaultCompetitionRegistrationSettings(competitionId)

    const answersRaw = payload.answers && typeof payload.answers === 'object' ? payload.answers : {}

    for (const field of settings.fields) {
      if (!field.required) continue
      const value = answersRaw[field.id]
      const hasValue =
        value && typeof value === 'object'
          ? true
          : Boolean(String(value || '').trim())
      if (!hasValue) {
        return NextResponse.json({ error: `${field.label} is required.` }, { status: 400 })
      }
    }

    const appDocId = `${competitionId}_${userId}`
    await adminDb.doc(`competitionRegistrationApplications/${appDocId}`).set(
      {
        competitionId,
        competitionName: competition.name,
        competitionDate: competition.date,
        userId,
        fullName,
        email,
        phone: String(answersRaw.emergency_contact || ''),
        answers: answersRaw,
        createdAt: Date.now(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit competition registration.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
