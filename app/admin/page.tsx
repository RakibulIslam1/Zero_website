'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { useAuth, UserProfile } from '@/components/AuthProvider'
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase'

type AdminProfileRow = UserProfile & { uid: string }
type AdminRegistration = {
  competitionId: number
  competitionName: string
  competitionDate: string
  teamName: string
  submittedAt: string
}
type ContactMessage = {
  id: string
  name?: string
  email?: string
  subject?: string
  message?: string
  createdAt?: number
  status?: string
}

const SUPER_ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

export default function AdminPage() {
  const router = useRouter()
  const {
    user,
    loading: authLoading,
    isAdmin,
    isSuperAdmin,
    adminEmails,
    grantAdminAccess,
    revokeAdminAccess,
  } = useAuth()

  const [rows, setRows] = useState<AdminProfileRow[]>([])
  const [loadingRows, setLoadingRows] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeUid, setActiveUid] = useState<string | null>(null)
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({})
  const [selectedUid, setSelectedUid] = useState<string>('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [adminActionMessage, setAdminActionMessage] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState('')
  const [activeTab, setActiveTab] = useState<'nonVerified' | 'verified' | null>(null)
  const [nameSearch, setNameSearch] = useState('')
  const [registrationsByUid, setRegistrationsByUid] = useState<Record<string, AdminRegistration[]>>({})
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [loadingContactMessages, setLoadingContactMessages] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadProfiles = async () => {
      setLoadingRows(true)
      setError(null)

      const db = getFirestoreDb()
      if (!db) {
        setError('Firestore is not configured. Set NEXT_PUBLIC_FIREBASE_* values.')
        setLoadingRows(false)
        return
      }

      try {
        const profilesRef = collection(db, 'profiles')
        const registrationsRef = collection(db, 'userRegistrations')
        const [snap, registrationsSnap] = await Promise.all([getDocs(profilesRef), getDocs(registrationsRef)])

        const items = snap.docs
          .map((item) => ({
            uid: item.id,
            ...(item.data() as UserProfile),
            educationLevel: (item.data().educationLevel as string) || '',
            instituteName: (item.data().instituteName as string) || '',
            verificationStatus: (item.data().verificationStatus as UserProfile['verificationStatus']) || 'pending',
            verificationReason: (item.data().verificationReason as string) || '',
            verificationUpdatedAt: (item.data().verificationUpdatedAt as number) || 0,
          }))
          .sort((a, b) => (b.verificationUpdatedAt || 0) - (a.verificationUpdatedAt || 0))

        const nextRegistrationsByUid: Record<string, AdminRegistration[]> = {}
        registrationsSnap.forEach((registrationDoc) => {
          const items = (registrationDoc.data().items as AdminRegistration[] | undefined) ?? []
          nextRegistrationsByUid[registrationDoc.id] = items
        })

        setRows(items)
        setRegistrationsByUid(nextRegistrationsByUid)
      } catch (err) {
        setError(toAdminError(err, 'Failed to load profiles.'))
      } finally {
        setLoadingRows(false)
      }
    }

    loadProfiles()
  }, [authLoading, user, isAdmin])

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return

    const loadContactMessages = async () => {
      setLoadingContactMessages(true)

      try {
        const firebaseAuth = getFirebaseAuth()
        const token = await firebaseAuth?.currentUser?.getIdToken(true)
        if (!token) {
          setLoadingContactMessages(false)
          return
        }

        const response = await fetch('/api/admin/contact-messages', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load contact messages.')
        }

        const payload = (await response.json()) as { items?: ContactMessage[] }
        setContactMessages(payload.items ?? [])
      } catch (err) {
        setError(toAdminError(err, 'Failed to load contact messages.'))
      } finally {
        setLoadingContactMessages(false)
      }
    }

    void loadContactMessages()
  }, [authLoading, user, isAdmin])

  const grouped = useMemo(() => {
    return {
      verified: rows.filter((row) => row.verificationStatus === 'verified'),
      nonVerified: rows.filter((row) => row.verificationStatus !== 'verified'),
      cancelled: rows.filter((row) => row.verificationStatus === 'cancelled'),
    }
  }, [rows])

  const selectedProfile = useMemo(
    () => rows.find((row) => row.uid === selectedUid) ?? null,
    [rows, selectedUid],
  )

  const toAdminError = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      const lowered = error.message.toLowerCase()
      if (lowered.includes('permission-denied') || lowered.includes('missing or insufficient permissions')) {
        return 'Permission denied by Firestore rules. Please update Firestore rules to allow admin verify/cancel/delete actions.'
      }

      return error.message
    }

    return fallback
  }

  const updateStatus = async (target: AdminProfileRow, status: UserProfile['verificationStatus'], reason = '') => {
    if (target.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      setError('Super admin account is permanently verified.')
      return
    }

    const db = getFirestoreDb()
    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setError(null)
    setActiveUid(target.uid)

    try {
      const now = Date.now()

      await updateDoc(doc(db, 'profiles', target.uid), {
        verificationStatus: status,
        verificationReason: reason,
        verificationUpdatedAt: now,
        updatedAt: now,
      })

      if (status === 'cancelled' && reason.trim()) {
        let cancellationMailStatus: 'sent' | 'failed' = 'sent'
        let cancellationMailError = ''

        try {
          const response = await fetch('/api/admin/rejection-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: target.email,
              fullName: target.fullName || 'Participant',
              reason,
            }),
          })

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string }
            throw new Error(payload.error || 'Failed to send rejection email.')
          }
        } catch (mailError) {
          cancellationMailStatus = 'failed'
          cancellationMailError = mailError instanceof Error ? mailError.message : 'Failed to send rejection email.'
        }

        await setDoc(doc(db, 'userRegistrations', target.uid), {
          verificationStatus: 'cancelled',
          verificationReason: reason,
          verificationUpdatedAt: now,
          cancellationMailStatus,
          cancellationMailError,
          updatedAt: now,
        }, { merge: true })

        if (cancellationMailStatus === 'failed') {
          setError(`Verification cancelled but email sending failed: ${cancellationMailError}`)
        }
      }

      setRows((prev) =>
        prev.map((item) =>
          item.uid === target.uid
            ? {
                ...item,
                verificationStatus: status,
                verificationReason: reason,
                verificationUpdatedAt: now,
              }
            : item,
        ),
      )
    } catch (err) {
      const message = toAdminError(err, 'Failed to update verification status.')
      setError(message)
      throw new Error(message)
    } finally {
      setActiveUid(null)
      setCancelReasons((prev) => ({ ...prev, [target.uid]: '' }))
    }
  }

  const handleDeleteAccountData = async (target: AdminProfileRow) => {
    if (target.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      setError('Super admin account data cannot be deleted from panel.')
      return
    }

    const status = target.verificationStatus || 'pending'
    const cancellationReason = (cancelReasons[target.uid] || '').trim()

    if (status !== 'verified') {
      if (!cancellationReason) {
        setError('Please provide a cancellation reason before deleting this account.')
        return
      }

      try {
        const response = await fetch('/api/admin/rejection-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: target.email,
            fullName: target.fullName || 'Participant',
            reason: cancellationReason,
          }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to send rejection email.')
        }
      } catch (mailError) {
        setError(mailError instanceof Error ? mailError.message : 'Failed to send rejection email.')
        return
      }
    }

    const firebaseAuth = getFirebaseAuth()
    const token = await firebaseAuth?.currentUser?.getIdToken(true)
    if (!token) {
      setError('You must be logged in as admin to delete this account.')
      return
    }

    setActiveUid(target.uid)
    setError(null)

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: target.uid,
          email: target.email,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to delete account.')
      }

      setRows((prev) => prev.filter((item) => item.uid !== target.uid))
      setRegistrationsByUid((prev) => {
        const next = { ...prev }
        delete next[target.uid]
        return next
      })
      setCancelReasons((prev) => {
        const next = { ...prev }
        delete next[target.uid]
        return next
      })
      setSelectedUid('')
    } catch (err) {
      setError(toAdminError(err, 'Failed to delete account data and auth user.'))
    } finally {
      setActiveUid(null)
    }
  }

  const handleAssignAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminActionMessage('')
    setError(null)

    const email = newAdminEmail.trim().toLowerCase()
    if (!email) {
      setError('Enter an email to assign admin access.')
      return
    }

    try {
      await grantAdminAccess(email)
      setAdminActionMessage('Admin access granted successfully.')
      setNewAdminEmail('')
    } catch (err) {
      setError(toAdminError(err, 'Failed to grant admin access.'))
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    setAdminActionMessage('')
    setError(null)

    try {
      await revokeAdminAccess(email)
      setAdminActionMessage('Admin access removed successfully.')
    } catch (err) {
      setError(toAdminError(err, 'Failed to remove admin access.'))
    }
  }

  if (authLoading) {
    return (
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-8 text-center text-gray-600">
          Checking admin access…
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-8 text-center text-gray-600">
          Redirecting to login…
        </div>
      </main>
    )
  }

  if (user && !isAdmin) {
    return (
      <main className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Access Required</h1>
          <p className="text-gray-600 mt-2">This page is only available for the authorized admin account.</p>
          <Link href="/" className="inline-flex mt-6 px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition-colors">
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Admin Verification Panel</h1>
          <p className="text-gray-600 mt-2">
            Review all accounts, open any profile, verify/cancel, and delete account data when needed.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-[#edf9f0] border border-[#cdebd4] text-green-700">Verified: {grouped.verified.length}</span>
            <span className="px-3 py-1 rounded-full bg-[#fff4ef] border border-[#f1d9d2] text-accent">Non-Verified: {grouped.nonVerified.length}</span>
            <span className="px-3 py-1 rounded-full bg-[#fff0f0] border border-[#f5d1d1] text-red-700">Cancelled: {grouped.cancelled.length}</span>
          </div>
        </section>

        {isSuperAdmin && (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Admin Access Management</h2>
            <p className="text-sm text-gray-600 mt-1">Only super admin can add or remove admin users.</p>

            <form onSubmit={handleAssignAdmin} className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(event) => setNewAdminEmail(event.target.value)}
                placeholder="Enter email to make admin"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
              >
                Add Admin
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {adminEmails.map((email) => {
                const isSuper = email === SUPER_ADMIN_EMAIL
                return (
                  <div key={email} className="flex items-center justify-between rounded-2xl border border-[#efd6d1] bg-[#fff9f8] px-4 py-3">
                    <p className="text-sm text-gray-700">{email}{isSuper ? ' (Super Admin)' : ''}</p>
                    {!isSuper && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveAdmin(email)}
                        className="text-sm px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {adminActionMessage && <p className="text-sm text-green-700 mt-3">{adminActionMessage}</p>}
          </section>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{error}</div>
        )}

        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Contact Messages</h2>
          <p className="text-sm text-gray-600 mt-1">Messages submitted from the website Contact Us form.</p>

          {loadingContactMessages ? (
            <p className="text-sm text-gray-600 mt-4">Loading contact messages…</p>
          ) : contactMessages.length === 0 ? (
            <p className="text-sm text-gray-600 mt-4">No contact messages yet.</p>
          ) : (
            <div className="mt-4 space-y-3 max-h-[320px] overflow-auto pr-1">
              {contactMessages.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{entry.subject || 'No subject'}</p>
                      <p className="text-xs text-gray-600 mt-1">{entry.name || 'Unknown'} • {entry.email || 'No email'}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Unknown date'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{entry.message || 'No message content.'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {loadingRows ? (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">Loading profiles…</section>
        ) : rows.length === 0 ? (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">No profiles found.</section>
        ) : (
          <>
            {lightboxUrl && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setLightboxUrl(null)}
              >
                <div
                  className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lightboxUrl} alt={lightboxAlt} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(null)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-gray-900 hover:bg-white flex items-center justify-center font-bold text-xl shadow"
                    aria-label="Close preview"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab(activeTab === 'nonVerified' ? null : 'nonVerified'); setNameSearch(''); setSelectedUid('') }}
                  className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-colors border ${
                    activeTab === 'nonVerified'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-[#fff4ef] text-accent border-[#f1d9d2] hover:bg-[#ffe8e0]'
                  }`}
                >
                  Non-Verified ({grouped.nonVerified.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab(activeTab === 'verified' ? null : 'verified'); setNameSearch(''); setSelectedUid('') }}
                  className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-colors border ${
                    activeTab === 'verified'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-[#edf9f0] text-green-700 border-[#cdebd4] hover:bg-[#d6f5df]'
                  }`}
                >
                  Verified ({grouped.verified.length})
                </button>
              </div>
            </section>

            <div className="flex flex-col lg:flex-row gap-6">
              <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm w-full lg:w-2/5">

                {/* LEFT: search + list */}
                <div className="p-5 flex flex-col gap-3">
                  {activeTab === null ? (
                    <p className="text-sm text-gray-500 text-center py-10">Select a tab above to view accounts.</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        placeholder="Search by name…"
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      <div className="space-y-2 overflow-auto pr-1" style={{ maxHeight: 'calc(100vh - 420px)', minHeight: '200px' }}>
                        {(activeTab === 'nonVerified' ? grouped.nonVerified : grouped.verified)
                          .filter((a) =>
                            nameSearch.trim() === '' ||
                            (a.fullName ?? '').toLowerCase().includes(nameSearch.toLowerCase())
                          )
                          .map((account) => (
                            <button
                              key={account.uid}
                              type="button"
                              onClick={() => setSelectedUid(account.uid)}
                              className={`w-full text-left rounded-2xl border px-3 py-2.5 transition-colors ${
                                selectedProfile?.uid === account.uid
                                  ? 'border-accent bg-[#fff4ef]'
                                  : 'border-[#efd6d1] bg-[#fff9f8] hover:bg-[#fff4ef]'
                              }`}
                            >
                              <p className="text-sm font-semibold text-gray-800">{account.fullName || 'Unnamed User'}</p>
                              <p className="text-xs text-gray-500">{account.email}</p>
                            </button>
                          ))
                        }
                        {(activeTab === 'nonVerified' ? grouped.nonVerified : grouped.verified)
                          .filter((a) => nameSearch.trim() === '' || (a.fullName ?? '').toLowerCase().includes(nameSearch.toLowerCase()))
                          .length === 0 && (
                          <p className="text-sm text-gray-500">
                            {nameSearch.trim() ? 'No accounts match your search.' : activeTab === 'nonVerified' ? 'No non-verified accounts.' : 'No verified accounts yet.'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>

                {/* RIGHT: detail panel */}
              <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm w-full lg:w-3/5">
                <div className="p-5 overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                {!selectedProfile ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Select an account from the list to review its details.</p>
                ) : (
                  (() => {
                    const status = selectedProfile.verificationStatus || 'pending'
                    const badgeClass =
                      status === 'verified'
                        ? 'bg-[#edf9f0] border-[#cdebd4] text-green-700'
                        : status === 'cancelled'
                          ? 'bg-[#fff0f0] border-[#f5d1d1] text-red-700'
                          : 'bg-[#fff4ef] border-[#f1d9d2] text-accent'
                    const isBuiltInAdminProfile = selectedProfile.email?.toLowerCase() === SUPER_ADMIN_EMAIL

                    return (
                      <article>
                        <div className="flex flex-wrap justify-between gap-3 items-start">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedProfile.fullName || 'Unnamed User'}</h2>
                            <p className="text-gray-600 text-sm mt-1">{selectedProfile.email}</p>
                            <p className="text-gray-600 text-sm">Phone: {selectedProfile.phone || 'Not provided'}</p>
                            <p className="text-gray-600 text-sm">Education: {selectedProfile.educationLevel || 'Not provided'}</p>
                            <p className="text-gray-600 text-sm">Institute: {selectedProfile.instituteName || 'Not provided'}</p>
                            <p className="text-gray-600 text-sm">ID: {selectedProfile.idType === 'passport' ? 'Passport' : selectedProfile.idType === 'nid' ? 'NID' : 'Birth Registration'} • {selectedProfile.idNumber || 'Not provided'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full border text-sm font-medium ${badgeClass}`}>
                            {status === 'verified' ? 'Verified' : status === 'cancelled' ? 'Cancelled' : 'Pending'}
                          </span>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                          <p className="text-sm font-semibold text-gray-800 mb-2">Registered Competitions</p>
                          {(registrationsByUid[selectedProfile.uid] ?? []).length > 0 ? (
                            <ul className="space-y-2">
                              {(registrationsByUid[selectedProfile.uid] ?? []).map((entry, index) => (
                                <li key={`${entry.competitionId}-${index}`} className="text-sm text-gray-700">
                                  <span className="font-medium">{entry.competitionName || `Competition #${entry.competitionId}`}</span>
                                  {entry.competitionDate ? ` • ${entry.competitionDate}` : ''}
                                  {entry.teamName ? ` • Team: ${entry.teamName}` : ''}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-600">No competition registrations found.</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">Profile Photo</p>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedProfile.profilePhotoDataUrl) {
                                  setLightboxAlt(`${selectedProfile.fullName ?? ''} profile photo`)
                                  setLightboxUrl(selectedProfile.profilePhotoDataUrl)
                                }
                              }}
                              className={`w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef] block ${
                                selectedProfile.profilePhotoDataUrl
                                  ? 'cursor-zoom-in hover:ring-2 hover:ring-accent/40 transition-all'
                                  : 'cursor-default'
                              }`}
                              title={selectedProfile.profilePhotoDataUrl ? 'Click to enlarge' : undefined}
                            >
                              {selectedProfile.profilePhotoDataUrl ? (
                                <Image
                                  src={selectedProfile.profilePhotoDataUrl}
                                  alt={`${selectedProfile.fullName} profile photo`}
                                  width={260}
                                  height={260}
                                  className="w-full h-full object-cover pointer-events-none"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No image</div>
                              )}
                            </button>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">ID Document</p>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedProfile.idDocumentPhotoDataUrl) {
                                  setLightboxAlt(`${selectedProfile.fullName ?? ''} id document`)
                                  setLightboxUrl(selectedProfile.idDocumentPhotoDataUrl)
                                }
                              }}
                              className={`w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef] block ${
                                selectedProfile.idDocumentPhotoDataUrl
                                  ? 'cursor-zoom-in hover:ring-2 hover:ring-accent/40 transition-all'
                                  : 'cursor-default'
                              }`}
                              title={selectedProfile.idDocumentPhotoDataUrl ? 'Click to enlarge' : undefined}
                            >
                              {selectedProfile.idDocumentPhotoDataUrl ? (
                                <Image
                                  src={selectedProfile.idDocumentPhotoDataUrl}
                                  alt={`${selectedProfile.fullName} id document`}
                                  width={260}
                                  height={260}
                                  className="w-full h-full object-cover pointer-events-none"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No document</div>
                              )}
                            </button>
                          </div>
                        </div>

                        {status === 'cancelled' && selectedProfile.verificationReason && (
                          <p className="text-sm text-red-700 mt-4">Cancellation reason: {selectedProfile.verificationReason}</p>
                        )}

                        {isBuiltInAdminProfile ? (
                          <p className="text-sm text-green-700 mt-5 font-medium">This account is permanently verified.</p>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-3 mt-5">
                              {status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={activeUid === selectedProfile.uid}
                                  onClick={() => updateStatus(selectedProfile, 'verified')}
                                  className="px-4 py-2.5 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
                                >
                                  {activeUid === selectedProfile.uid ? 'Updating…' : 'Verify'}
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={activeUid === selectedProfile.uid}
                                onClick={() => void handleDeleteAccountData(selectedProfile)}
                                className="px-4 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
                              >
                                {activeUid === selectedProfile.uid ? 'Deleting…' : 'Delete Account Data'}
                              </button>
                            </div>

                            {status !== 'verified' && (
                              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                                <input
                                  type="text"
                                  value={cancelReasons[selectedProfile.uid] || ''}
                                  onChange={(event) => setCancelReasons((prev) => ({ ...prev, [selectedProfile.uid]: event.target.value }))}
                                  placeholder="Reason for cancellation"
                                  className="flex-1 px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </article>
                    )
                  })()
                )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
