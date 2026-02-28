'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import { useAuth, UserProfile } from '@/components/AuthProvider'
import { getFirestoreDb } from '@/lib/firebase'

type AdminProfileRow = UserProfile & { uid: string }

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
        let snap

        try {
          const profileQuery = query(profilesRef, orderBy('updatedAt', 'desc'))
          snap = await getDocs(profileQuery)
        } catch {
          snap = await getDocs(profilesRef)
        }

        const items = snap.docs.map((item) => ({
          uid: item.id,
          ...(item.data() as UserProfile),
          educationLevel: (item.data().educationLevel as string) || '',
          instituteName: (item.data().instituteName as string) || '',
          verificationStatus: (item.data().verificationStatus as UserProfile['verificationStatus']) || 'pending',
          verificationReason: (item.data().verificationReason as string) || '',
          verificationUpdatedAt: (item.data().verificationUpdatedAt as number) || 0,
        }))

        setRows(items)
        if (items.length > 0) {
          setSelectedUid((prev) => prev || items[0].uid)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profiles.'
        setError(message)
      } finally {
        setLoadingRows(false)
      }
    }

    loadProfiles()
  }, [authLoading, user, isAdmin])

  const grouped = useMemo(() => {
    return {
      verified: rows.filter((row) => row.verificationStatus === 'verified'),
      nonVerified: rows.filter((row) => row.verificationStatus !== 'verified'),
      cancelled: rows.filter((row) => row.verificationStatus === 'cancelled'),
    }
  }, [rows])

  const selectedProfile = useMemo(
    () => rows.find((row) => row.uid === selectedUid) ?? rows[0] ?? null,
    [rows, selectedUid],
  )

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
        await setDoc(doc(db, 'userRegistrations', target.uid), {
          verificationStatus: 'cancelled',
          verificationReason: reason,
          verificationUpdatedAt: now,
          cancellationMailStatus: 'queued',
          updatedAt: now,
        }, { merge: true })

        await addDoc(collection(db, 'mailQueue'), {
          to: target.email,
          subject: 'Zero Competitions verification update',
          text: `Your verification was cancelled. Reason: ${reason}`,
          createdAt: now,
          status: 'queued',
        })
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
      const message = err instanceof Error ? err.message : 'Failed to update verification status.'
      setError(message)
    } finally {
      setActiveUid(null)
      setCancelReasons((prev) => ({ ...prev, [target.uid]: '' }))
    }
  }

  const handleCancel = async (event: FormEvent<HTMLFormElement>, target: AdminProfileRow) => {
    event.preventDefault()
    const trimmed = (cancelReasons[target.uid] || '').trim()

    if (!trimmed) {
      setError('Please provide a cancellation reason.')
      return
    }

    await updateStatus(target, 'cancelled', trimmed)
  }

  const handleDeleteAccountData = async (target: AdminProfileRow) => {
    if (target.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      setError('Super admin account data cannot be deleted from panel.')
      return
    }

    const db = getFirestoreDb()
    if (!db) {
      setError('Firestore is not configured.')
      return
    }

    setActiveUid(target.uid)
    setError(null)

    try {
      await Promise.all([
        deleteDoc(doc(db, 'profiles', target.uid)),
        deleteDoc(doc(db, 'userRegistrations', target.uid)),
      ])

      setRows((prev) => prev.filter((item) => item.uid !== target.uid))
      setSelectedUid('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account data.'
      setError(message)
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
      setError(err instanceof Error ? err.message : 'Failed to grant admin access.')
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    setAdminActionMessage('')
    setError(null)

    try {
      await revokeAdminAccess(email)
      setAdminActionMessage('Admin access removed successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin access.')
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

        {loadingRows ? (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">Loading profiles…</section>
        ) : rows.length === 0 ? (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">No profiles found.</section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-[#e8cfc9] shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Non-Verified Accounts</h3>
                <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                  {grouped.nonVerified.map((account) => (
                    <button
                      key={account.uid}
                      type="button"
                      onClick={() => setSelectedUid(account.uid)}
                      className={`w-full text-left rounded-2xl border px-3 py-2 transition-colors ${selectedProfile?.uid === account.uid ? 'border-accent bg-[#fff4ef]' : 'border-[#efd6d1] bg-[#fff9f8] hover:bg-[#fff4ef]'}`}
                    >
                      <p className="text-sm font-semibold text-gray-800">{account.fullName || 'Unnamed User'}</p>
                      <p className="text-xs text-gray-600">{account.email}</p>
                    </button>
                  ))}
                  {grouped.nonVerified.length === 0 && <p className="text-sm text-gray-500">No non-verified accounts.</p>}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-[#e8cfc9] shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Verified Accounts</h3>
                <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                  {grouped.verified.map((account) => (
                    <button
                      key={account.uid}
                      type="button"
                      onClick={() => setSelectedUid(account.uid)}
                      className={`w-full text-left rounded-2xl border px-3 py-2 transition-colors ${selectedProfile?.uid === account.uid ? 'border-accent bg-[#fff4ef]' : 'border-[#efd6d1] bg-[#fff9f8] hover:bg-[#fff4ef]'}`}
                    >
                      <p className="text-sm font-semibold text-gray-800">{account.fullName || 'Unnamed User'}</p>
                      <p className="text-xs text-gray-600">{account.email}</p>
                    </button>
                  ))}
                  {grouped.verified.length === 0 && <p className="text-sm text-gray-500">No verified accounts yet.</p>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              {!selectedProfile ? (
                <div className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">Select an account to review details.</div>
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
                    <article className="bg-white rounded-3xl p-6 border border-[#e8cfc9] shadow-sm">
                      <div className="flex flex-wrap justify-between gap-3 items-start">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedProfile.fullName || 'Unnamed User'}</h2>
                          <p className="text-gray-600 text-sm mt-1">{selectedProfile.email}</p>
                          <p className="text-gray-600 text-sm">Phone: {selectedProfile.phone || 'Not provided'}</p>
                          <p className="text-gray-600 text-sm">Education: {selectedProfile.educationLevel || 'Not provided'}</p>
                          <p className="text-gray-600 text-sm">Institute: {selectedProfile.instituteName || 'Not provided'}</p>
                          <p className="text-gray-600 text-sm">ID: {selectedProfile.idType === 'passport' ? 'Passport' : 'Birth Registration'} • {selectedProfile.idNumber || 'Not provided'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full border text-sm font-medium ${badgeClass}`}>
                          {status === 'verified' ? 'Verified' : status === 'cancelled' ? 'Cancelled' : 'Pending'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 mb-2">Profile Photo</p>
                          <div className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef]">
                            {selectedProfile.profilePhotoDataUrl ? (
                              <Image src={selectedProfile.profilePhotoDataUrl} alt={`${selectedProfile.fullName} profile photo`} width={260} height={260} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No image</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800 mb-2">ID Document</p>
                          <div className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef]">
                            {selectedProfile.idDocumentPhotoDataUrl ? (
                              <Image src={selectedProfile.idDocumentPhotoDataUrl} alt={`${selectedProfile.fullName} id document`} width={260} height={260} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No document</div>
                            )}
                          </div>
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
                            <button
                              type="button"
                              disabled={activeUid === selectedProfile.uid}
                              onClick={() => updateStatus(selectedProfile, 'verified')}
                              className="px-4 py-2.5 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
                            >
                              {activeUid === selectedProfile.uid ? 'Updating…' : 'Verify'}
                            </button>
                            <button
                              type="button"
                              disabled={activeUid === selectedProfile.uid}
                              onClick={() => void handleDeleteAccountData(selectedProfile)}
                              className="px-4 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
                            >
                              {activeUid === selectedProfile.uid ? 'Deleting…' : 'Delete Account Data'}
                            </button>
                          </div>

                          <form onSubmit={(event) => void handleCancel(event, selectedProfile)} className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                            <input
                              type="text"
                              value={cancelReasons[selectedProfile.uid] || ''}
                              onChange={(event) => setCancelReasons((prev) => ({ ...prev, [selectedProfile.uid]: event.target.value }))}
                              placeholder="Reason for cancellation"
                              className="flex-1 px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                            <button
                              type="submit"
                              disabled={activeUid === selectedProfile.uid}
                              className="px-4 py-2.5 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                              {activeUid === selectedProfile.uid ? 'Updating…' : 'Cancel Verification'}
                            </button>
                          </form>
                        </>
                      )}
                    </article>
                  )
                })()
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
