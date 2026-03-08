import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdminDb } from '@/lib/firebaseAdmin'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

type ThreadMessage = {
  sender: 'user' | 'admin'
  text: string
  createdAt: number
  senderName: string
}

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'any')
    const adminDb = getFirebaseAdminDb()

    const snap = await adminDb.collection('contactMessages').limit(300).get()
    const items = snap.docs
      .map((docItem) => normalizeThread(docItem.id, docItem.data() as Record<string, unknown>))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load contact messages.'
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, 'any')
    const adminDb = getFirebaseAdminDb()
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
        senderName: admin.email,
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
    const status = error instanceof HttpError ? error.status : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request, 'any')
    const adminDb = getFirebaseAdminDb()
    const payload = (await request.json()) as { contactId?: string; status?: string }
    const contactId = (payload.contactId || '').trim()
    const status = (payload.status || '').trim()

    if (!contactId || !status) {
      return NextResponse.json({ error: 'contactId and status are required.' }, { status: 400 })
    }

    const threadRef = adminDb.collection('contactMessages').doc(contactId)
    await threadRef.set({ status, updatedAt: Date.now() }, { merge: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update message status.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, 'any')
    if (!admin.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admin can delete chat threads.' }, { status: 403 })
    }

    const adminDb = getFirebaseAdminDb()
    const payload = (await request.json()) as { contactId?: string }
    const contactId = (payload.contactId || '').trim()

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required.' }, { status: 400 })
    }

    const threadRef = adminDb.collection('contactMessages').doc(contactId)
    const threadSnap = await threadRef.get()
    if (!threadSnap.exists) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    await threadRef.delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete conversation.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
