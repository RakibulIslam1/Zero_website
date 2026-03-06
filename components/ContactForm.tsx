'use client'

import { useEffect, useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { getFirebaseAuth } from '@/lib/firebase'
import { useNotification } from '@/components/NotificationProvider'

type ThreadMessage = {
  sender: 'user' | 'admin'
  text: string
  createdAt: number
  senderName?: string
}

type ContactThread = {
  id: string
  subject?: string
  status?: string
  updatedAt?: number
  messages?: ThreadMessage[]
}

export default function ContactForm() {
  const { user } = useAuth()
  const { notifyError, notifySuccess } = useNotification()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [threads, setThreads] = useState<ContactThread[]>([])
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState<string>('')
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [threads, activeThreadId],
  )

  const loadThreads = async () => {
    if (!user) return

    setLoadingThreads(true)
    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)

      if (!token) {
        setLoadingThreads(false)
        return
      }

      const response = await fetch('/api/contact', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to load message threads.')
      }

      const payload = (await response.json()) as { items?: ContactThread[] }
      const nextThreads = payload.items ?? []
      setThreads(nextThreads)
      if (!activeThreadId && nextThreads.length > 0) {
        setActiveThreadId(nextThreads[0].id)
      }
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to load message threads.')
    } finally {
      setLoadingThreads(false)
    }
  }

  useEffect(() => {
    void loadThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      notifyError('Please create an account and sign in before chatting with us.')
      return
    }

    setIsSubmitting(true)

    try {
      const token = (await getFirebaseAuth()?.currentUser?.getIdToken(true)) || ''
      if (!token) {
        throw new Error('Please sign in to continue.')
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to send your message.')
      }

      notifySuccess('Message sent successfully.')
      setForm({ name: '', email: '', subject: '', message: '' })
      await loadThreads()
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to send your message.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeThread || !replyText.trim() || !user) return

    setIsReplying(true)
    try {
      const token = (await getFirebaseAuth()?.currentUser?.getIdToken(true)) || ''
      if (!token) {
        throw new Error('Please sign in to continue this conversation.')
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId: activeThread.id,
          subject: activeThread.subject || 'Follow-up',
          message: replyText,
          name: user.fullName,
          email: user.email,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to send reply.')
      }

      setReplyText('')
      notifySuccess('Reply sent successfully.')
      await loadThreads()
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to send reply.')
    } finally {
      setIsReplying(false)
    }
  }

  useEffect(() => {
    if (!user) {
      setThreads([])
      setActiveThreadId('')
      setReplyText('')
      setForm((prev) => ({ ...prev, email: '', name: '' }))
      return
    }

    setForm((prev) => ({
      ...prev,
      name: prev.name || user.fullName,
      email: prev.email || user.email,
    }))
  }, [user])

  return (
    <div className="space-y-8">
      {!user && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Create an account and sign in to start chatting with the team.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              disabled={!user}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              disabled={!user}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              placeholder="john@example.com"
            />
          </div>
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject *
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={form.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
            placeholder="How can we help?"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            value={form.message}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors resize-none"
            placeholder="Tell us about your project..."
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Send size={18} />
          <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
        </button>
      </form>

      {user && (
        <section className="rounded-2xl border border-[#e8cfc9] bg-[#fff9f8] p-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Conversations</h3>

          {loadingThreads ? (
            <p className="text-sm text-gray-600">Loading conversations...</p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-gray-600">No conversation yet. Send your first message above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 text-sm ${
                      activeThreadId === thread.id ? 'border-accent bg-[#fff0eb]' : 'border-[#efd6d1] bg-white'
                    }`}
                  >
                    <p className="font-medium text-gray-800">{thread.subject || 'No subject'}</p>
                    <p className="text-xs text-gray-500">{thread.updatedAt ? new Date(thread.updatedAt).toLocaleString() : 'No time'}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-[#efd6d1] bg-white p-3">
                {!activeThread ? (
                  <p className="text-sm text-gray-600">Select a conversation to view replies.</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
                      {(activeThread.messages ?? []).map((entry, index) => (
                        <div
                          key={`${entry.createdAt}-${index}`}
                          className={`rounded-lg px-3 py-2 text-sm ${entry.sender === 'admin' ? 'bg-[#edf9f0] text-green-800' : 'bg-[#fff4ef] text-gray-800'}`}
                        >
                          <p className="font-medium text-xs mb-1">{entry.sender === 'admin' ? 'Admin' : 'You'}</p>
                          <p className="whitespace-pre-wrap">{entry.text}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleReply} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 rounded-xl border border-[#e8cfc9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      <button
                        type="submit"
                        disabled={isReplying}
                        className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-60"
                      >
                        {isReplying ? 'Sending...' : 'Reply'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
