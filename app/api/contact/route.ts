import { NextResponse } from 'next/server'
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

type ContactPayload = {
  threadId?: string
  name?: string
  email?: string
  subject?: string
  message?: string
}

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

async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  if (!token) return null

  try {
    const adminAuth = getFirebaseAdminAuth()
    const decoded = await adminAuth.verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const authedUser = await getAuthenticatedUser(request)
    if (!authedUser?.uid) {
      return NextResponse.json({ error: 'You must be signed in to view message replies.' }, { status: 401 })
    }

    const adminDb = getFirebaseAdminDb()
    const snap = await adminDb.collection('contactMessages').where('userId', '==', authedUser.uid).get()

    const items = snap.docs
      .map((docItem) => normalizeThread(docItem.id, docItem.data() as Record<string, unknown>))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load contact threads.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactPayload
    const authedUser = await getAuthenticatedUser(request)

    const threadId = (payload.threadId || '').trim()
    const name = (payload.name || '').trim()
    const email = (payload.email || '').trim()
    const subject = (payload.subject || '').trim()
    const message = (payload.message || '').trim()

    if (!message) {
      return NextResponse.json({ error: 'Please fill all required fields.' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
    }

    const adminDb = getFirebaseAdminDb()
    const now = Date.now()

    if (threadId) {
      const threadRef = adminDb.collection('contactMessages').doc(threadId)
      const threadSnap = await threadRef.get()

      if (!threadSnap.exists) {
        return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
      }

      const existingData = threadSnap.data() as Record<string, unknown>
      if (authedUser?.uid && existingData.userId && existingData.userId !== authedUser.uid) {
        return NextResponse.json({ error: 'You are not allowed to reply to this conversation.' }, { status: 403 })
      }

      const existingMessages = getThreadMessages(existingData)
      const nextMessages = [
        ...existingMessages,
        {
          sender: 'user' as const,
          text: message,
          createdAt: now,
          senderName: name || authedUser?.name || String(existingData.name || 'User'),
        },
      ]

      await threadRef.set(
        {
          messages: nextMessages,
          updatedAt: now,
          status: 'open',
        },
        { merge: true },
      )

      return NextResponse.json({ success: true, threadId })
    }

    if (!name || !email || !subject) {
      return NextResponse.json({ error: 'Please fill all required fields.' }, { status: 400 })
    }

    const created = await adminDb.collection('contactMessages').add({
      userId: authedUser?.uid || null,
      name,
      email,
      subject,
      createdAt: now,
      updatedAt: now,
      status: 'new',
      messages: [
        {
          sender: 'user',
          text: message,
          createdAt: now,
          senderName: name,
        },
      ],
    })

    return NextResponse.json({ success: true, threadId: created.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send contact message.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
