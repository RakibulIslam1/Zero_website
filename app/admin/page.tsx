'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { addDoc, collection, doc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import { useAuth, UserProfile } from '@/components/AuthProvider'
import { getFirestoreDb } from '@/lib/firebase'

type AdminProfileRow = UserProfile & { uid: string }

const ADMIN_EMAIL = 'rakibul.rir06@gmail.com'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [rows, setRows] = useState<AdminProfileRow[]>([])
  const [loadingRows, setLoadingRows] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeUid, setActiveUid] = useState<string | null>(null)
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({})

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

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
        const profileQuery = query(profilesRef, orderBy('updatedAt', 'desc'))
        const snap = await getDocs(profileQuery)

        const items = snap.docs.map((item) => ({
          uid: item.id,
          ...(item.data() as UserProfile),
          verificationStatus: (item.data().verificationStatus as UserProfile['verificationStatus']) || 'pending',
          verificationReason: (item.data().verificationReason as string) || '',
          verificationUpdatedAt: (item.data().verificationUpdatedAt as number) || 0,
        }))

        setRows(items)
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
      pending: rows.filter((row) => (row.verificationStatus || 'pending') === 'pending'),
      verified: rows.filter((row) => row.verificationStatus === 'verified'),
      cancelled: rows.filter((row) => row.verificationStatus === 'cancelled'),
    }
  }, [rows])

  const updateStatus = async (target: AdminProfileRow, status: UserProfile['verificationStatus'], reason = '') => {
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
            Review submitted profile details and uploaded documents. Verify or cancel with a reason.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-[#fff4ef] border border-[#f1d9d2] text-accent">Pending: {grouped.pending.length}</span>
            <span className="px-3 py-1 rounded-full bg-[#edf9f0] border border-[#cdebd4] text-green-700">Verified: {grouped.verified.length}</span>
            <span className="px-3 py-1 rounded-full bg-[#fff0f0] border border-[#f5d1d1] text-red-700">Cancelled: {grouped.cancelled.length}</span>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{error}</div>
        )}

        {loadingRows ? (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">Loading profiles…</section>
        ) : rows.length === 0 ? (
          <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm text-gray-600">No profiles found.</section>
        ) : (
          <section className="space-y-4">
            {rows.map((profile) => {
              const isBuiltInAdminProfile = profile.email?.toLowerCase() === ADMIN_EMAIL
              const status = profile.verificationStatus || 'pending'
              const badgeClass =
                status === 'verified'
                  ? 'bg-[#edf9f0] border-[#cdebd4] text-green-700'
                  : status === 'cancelled'
                    ? 'bg-[#fff0f0] border-[#f5d1d1] text-red-700'
                    : 'bg-[#fff4ef] border-[#f1d9d2] text-accent'

              return (
                <article key={profile.uid} className="bg-white rounded-3xl p-6 border border-[#e8cfc9] shadow-sm">
                  <div className="flex flex-wrap justify-between gap-3 items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{profile.fullName || 'Unnamed User'}</h2>
                      <p className="text-gray-600 text-sm mt-1">{profile.email}</p>
                      <p className="text-gray-600 text-sm">Phone: {profile.phone || 'Not provided'}</p>
                      <p className="text-gray-600 text-sm">ID: {profile.idType === 'passport' ? 'Passport' : 'Birth Registration'} • {profile.idNumber || 'Not provided'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full border text-sm font-medium ${badgeClass}`}>
                      {status === 'verified' ? 'Verified' : status === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">Profile Photo</p>
                      <div className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef]">
                        {profile.profilePhotoDataUrl ? (
                          <Image src={profile.profilePhotoDataUrl} alt={`${profile.fullName} profile photo`} width={260} height={260} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No image</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">ID Document</p>
                      <div className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#edd4ce] bg-[#faf1ef]">
                        {profile.idDocumentPhotoDataUrl ? (
                          <Image src={profile.idDocumentPhotoDataUrl} alt={`${profile.fullName} id document`} width={260} height={260} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No document</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {status === 'cancelled' && profile.verificationReason && (
                    <p className="text-sm text-red-700 mt-4">Cancellation reason: {profile.verificationReason}</p>
                  )}

                  {isBuiltInAdminProfile ? (
                    <p className="text-sm text-green-700 mt-5 font-medium">This account is permanently verified.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-3 mt-5">
                        <button
                          type="button"
                          disabled={activeUid === profile.uid}
                          onClick={() => updateStatus(profile, 'verified')}
                          className="px-4 py-2.5 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
                        >
                          {activeUid === profile.uid ? 'Updating…' : 'Verify'}
                        </button>
                      </div>

                      <form onSubmit={(event) => void handleCancel(event, profile)} className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                        <input
                          type="text"
                          value={cancelReasons[profile.uid] || ''}
                          onChange={(event) => setCancelReasons((prev) => ({ ...prev, [profile.uid]: event.target.value }))}
                          placeholder="Reason for cancellation"
                          className="flex-1 px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                        <button
                          type="submit"
                          disabled={activeUid === profile.uid}
                          className="px-4 py-2.5 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                          {activeUid === profile.uid ? 'Updating…' : 'Cancel Verification'}
                        </button>
                      </form>
                    </>
                  )}
                </article>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
