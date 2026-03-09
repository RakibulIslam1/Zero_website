import { NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { getStaticCompetitionCmsItems, normalizeCompetitionCmsItem } from '@/lib/competitionCms'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = String(searchParams.get('slug') || '').trim()

    const adminDb = getFirebaseAdminDb()
    const snap = await adminDb.collection('competitionsCms').get()
    let items = snap.docs
      .map((docItem) => normalizeCompetitionCmsItem(docItem.data() as Record<string, unknown>, Number(docItem.id)))
      .sort((a, b) => a.id - b.id)

    if (items.length === 0) {
      items = getStaticCompetitionCmsItems()
    }

    if (slug) {
      const item = items.find((entry) => entry.slug === slug)
      if (!item) {
        return NextResponse.json({ error: 'Competition not found.' }, { status: 404 })
      }
      return NextResponse.json({ competition: item })
    }

    return NextResponse.json({ competitions: items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load competitions.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
