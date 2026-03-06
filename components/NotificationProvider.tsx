'use client'

import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'

type NotificationType = 'success' | 'error' | 'info'

type NotificationInput = {
  message: string
  type?: NotificationType
}

type NotificationItem = {
  id: number
  message: string
  type: NotificationType
}

type NotificationContextValue = {
  notify: (input: NotificationInput) => void
  notifySuccess: (message: string) => void
  notifyError: (message: string) => void
  notifyInfo: (message: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

function toastStyle(type: NotificationType) {
  if (type === 'success') {
    return 'border-green-200 bg-green-50 text-green-800'
  }

  if (type === 'error') {
    return 'border-red-200 bg-red-50 text-red-800'
  }

  return 'border-sky-200 bg-sky-50 text-sky-800'
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const idRef = useRef(0)

  const notify = useCallback((input: NotificationInput) => {
    const message = input.message.trim()
    if (!message) return

    idRef.current += 1
    const nextId = idRef.current
    const nextItem: NotificationItem = {
      id: nextId,
      message,
      type: input.type || 'info',
    }

    setNotifications((prev) => [...prev, nextItem])

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((entry) => entry.id !== nextId))
    }, 3000)
  }, [])

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      notifySuccess: (message: string) => notify({ message, type: 'success' }),
      notifyError: (message: string) => notify({ message, type: 'error' }),
      notifyInfo: (message: string) => notify({ message, type: 'info' }),
    }),
    [notify],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-24 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {notifications.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${toastStyle(entry.type)}`}
            role="status"
            aria-live="polite"
          >
            {entry.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }

  return context
}
