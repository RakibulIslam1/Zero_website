import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

type ThreadMessage = {
  sender: 'user' | 'admin'
  text: string
  createdAt: number
  senderName: string
}

function normalizeThread(docId: string, data: Record<string, unknown>) {
  const existingMessages = (data.messages as ThreadMessage[] | undefined) ?? []
  const legacyMessage = typeof data.message === 'string' ? data.message : ''
  const messages = existingMessages.length > 0
    ? existingMessages
    : legacyMessage
      ? [
          {
            sender: 'user' as const,
            text: legacyMessage,
            createdAt: Number(data.createdAt || Date.now()),
            senderName: String(data.name || 'User'),
          },
        ]
      : []

  return {
    id: docId,
    name: String(data.name || ''),
    email: String(data.email || ''),
    subject: String(data.subject || ''),
    createdAt: Number(data.createdAt || 0),
    updatedAt: Number(data.updatedAt || data.createdAt || 0),
    status: String(data.status || 'new'),
    messages,
  }
}

function getThreadMessages(data: Record<string, unknown>) {
  const existingMessages = (data.messages as ThreadMessage[] | undefined) ?? []
  if (existingMessages.length > 0) {
    return existingMessages
  }

  const legacyMessage = typeof data.message === 'string' ? data.message : ''
  if (!legacyMessage) {
    return []
  }

  return [
    {
      sender: 'user' as const,
      text: legacyMessage,
      createdAt: Number(data.createdAt || Date.now()),
      senderName: String(data.name || 'User'),
    },
  ]
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
    throw new Error('Only admin users can view contact messages.')
  }

  return { adminDb, requesterName: decoded.name || requesterEmail }
}

export async function GET(request: Request) {
  try {
    const { adminDb } = await requireAdmin(request)

    const snap = await adminDb.collection('contactMessages').limit(300).get()
    const items = snap.docs
      .map((docItem) => normalizeThread(docItem.id, docItem.data() as Record<string, unknown>))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load contact messages.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { adminDb, requesterName } = await requireAdmin(request)
    const payload = (await request.json()) as { contactId?: string; reply?: string }
    const contactId = (payload.contactId || '').trim()
    const reply = (payload.reply || '').trim()

    if (!contactId || !reply) {
      return NextResponse.json({ error: 'contactId and reply are required.' }, { status: 400 })
    }

    const threadRef = adminDb.collection('contactMessages').doc(contactId)
    const threadSnap = await threadRef.get()
    if (!threadSnap.exists) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    const data = threadSnap.data() as Record<string, unknown>
    const existingMessages = getThreadMessages(data)
    const now = Date.now()

    const nextMessages = [
      ...existingMessages,
      {
        sender: 'admin' as const,
        text: reply,
        createdAt: now,
        senderName: requesterName,
      },
    ]

    await threadRef.set(
      {
        messages: nextMessages,
        updatedAt: now,
        status: 'replied',
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reply.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
