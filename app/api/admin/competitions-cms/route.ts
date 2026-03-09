import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import {
  getStaticCompetitionCmsItems,
  normalizeCompetitionCmsItem,
  slugifyCompetitionName,
} from '@/lib/competitionCms'

export const runtime = 'nodejs'
const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

type CompetitionPayload = {
  id?: number
  slug?: string
  name?: string
  date?: string
  description?: string
  status?: string
  prize?: string
  miniBannerImageUrl?: string
  pageSections?: Array<{
    id?: string
    heading?: string
    body?: string
    imageUrl?: string
    imagePosition?: string
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
  if (!(requesterEmail === SUPER_ADMIN_EMAIL || adminEmails.includes(requesterEmail))) {
    throw new Error('Only admin users can manage competitions.')
  }

  return { adminDb }
}

export async function GET(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const snap = await adminDb.collection('competitionsCms').get()
    let items = snap.docs
      .map((docItem) => normalizeCompetitionCmsItem(docItem.data() as Record<string, unknown>, Number(docItem.id)))
      .sort((a, b) => a.id - b.id)

    if (items.length === 0) {
      items = getStaticCompetitionCmsItems()
      await Promise.all(
        items.map((item) =>
          adminDb.doc(`competitionsCms/${item.id}`).set(item, { merge: true }),
        ),
      )
    }

    return NextResponse.json({ competitions: items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load competitions CMS data.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const payload = (await request.json()) as CompetitionPayload

    const snap = await adminDb.collection('competitionsCms').get()
    const existingItems = snap.docs.map((docItem) =>
      normalizeCompetitionCmsItem(docItem.data() as Record<string, unknown>, Number(docItem.id)),
    )

    const requestedId = Number(payload.id)
    const nextId = Number.isFinite(requestedId)
      ? requestedId
      : Math.max(0, ...existingItems.map((entry) => entry.id)) + 1

    const normalized = normalizeCompetitionCmsItem(
      {
        id: nextId,
        slug: payload.slug || slugifyCompetitionName(String(payload.name || `competition-${nextId}`)),
        name: payload.name,
        date: payload.date,
        description: payload.description,
        status: payload.status,
        prize: payload.prize,
        miniBannerImageUrl: payload.miniBannerImageUrl,
        pageSections: payload.pageSections,
        createdAt: existingItems.find((entry) => entry.id === nextId)?.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      nextId,
    )

    await adminDb.doc(`competitionsCms/${nextId}`).set(normalized, { merge: true })

    return NextResponse.json({ success: true, id: nextId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save competition.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)
    const payload = (await request.json()) as { id?: number }
    const id = Number(payload.id)

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Competition id is required.' }, { status: 400 })
    }

    await adminDb.doc(`competitionsCms/${id}`).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete competition.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
