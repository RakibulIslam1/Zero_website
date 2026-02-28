'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, type UserProfile } from '@/components/AuthProvider'
import { competitions } from '@/lib/competitions'

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  idType: 'birth-registration',
  idNumber: '',
  profilePhotoDataUrl: '',
  idDocumentPhotoDataUrl: '',
  verificationStatus: 'pending',
  verificationReason: '',
  verificationUpdatedAt: 0,
}

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('permission') || message.includes('Missing or insufficient permissions')) {
    return 'Permission denied while saving. Please check Firestore rules and login again.'
  }

  if (message.includes('Firestore is not configured')) {
    return 'Database setup is incomplete. Please configure Firebase environment variables.'
  }

  return 'Could not save profile. Please try again.'
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, registrations, updateProfile, isProfileComplete, signOut } = useAuth()
  const [form, setForm] = useState<UserProfile>(profile ?? emptyProfile)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!user) return

    if (profile) {
      setForm(profile)
      return
    }

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName,
      email: prev.email || user.email,
    }))
  }, [profile, user])

  const heading = useMemo(() => {
    if (isProfileComplete) return 'Your Profile'
    return 'Complete Your Profile'
  }, [isProfileComplete])

  const missingItems = useMemo(() => {
    const missing: string[] = []
    if (!form.phone) missing.push('Phone number')
    if (!form.address) missing.push('Address')
    if (!form.dateOfBirth) missing.push('Date of birth')
    if (!form.idNumber) missing.push('Birth registration / passport number')
    if (!form.profilePhotoDataUrl) missing.push('Profile photo')
    if (!form.idDocumentPhotoDataUrl) missing.push('ID document photo')
    return missing
  }, [form])

  const registeredCompetitionDetails = useMemo(() => {
    return registrations
      .map((registration) => {
        const found = competitions.find((competition) => competition.id === registration.competitionId)
        if (!found) return null
        return {
          ...found,
          submittedAt: registration.submittedAt,
        }
      })
      .filter(Boolean)
  }, [registrations])

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign in required</h1>
          <p className="text-gray-600 mb-6">You need to sign in before accessing your profile.</p>
          <Link href="/login" className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, field: 'profilePhotoDataUrl' | 'idDocumentPhotoDataUrl') => {
    const file = event.target.files?.[0]
    if (!file) return

    const maxSizeInBytes = 2 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      setSaveError('Image size is too big. Please upload an image within 2MB.')
      return
    }

    const dataUrl = await fileToDataUrl(file)
    setForm((prev) => ({ ...prev, [field]: dataUrl }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaveError('')
    setSaveMessage('')
    setSaving(true)

    try {
      await updateProfile(form)
      setSaveMessage('Profile saved successfully.')
      setEditMode(false)
    } catch (error) {
      setSaveError(toFriendlyError(error))
    } finally {
      setTimeout(() => setSaving(false), 350)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 border border-[#e8cfc9] shadow-sm">
            <div className="w-48 h-48 rounded-full overflow-hidden bg-[#f4d8d2] flex items-center justify-center text-accent font-semibold text-5xl mx-auto border-4 border-[#f1d3cc]">
              {(form.profilePhotoDataUrl || user.avatarDataUrl) ? (
                <Image src={form.profilePhotoDataUrl || user.avatarDataUrl || ''} alt={user.fullName} width={192} height={192} className="w-full h-full object-cover" />
              ) : (
                user.fullName.slice(0, 1).toUpperCase()
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditMode((current) => !current)}
              className="w-full mt-6 px-4 py-3 rounded-2xl border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors"
            >
              {editMode ? 'Close Edit Profile' : 'Edit Profile'}
            </button>

            <p className="mt-4 text-sm font-medium text-gray-700">
              Profile status: <span className={isProfileComplete ? 'text-green-700' : 'text-accent'}>{isProfileComplete ? 'Complete' : 'Incomplete'}</span>
            </p>

            {missingItems.length > 0 && (
              <div className="mt-5 rounded-2xl border border-[#f1c8c0] bg-[#fff5f2] p-4">
                <p className="text-sm font-semibold text-accent mb-2">Missing documents/info</p>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-600 mt-2">Use Edit Profile to upload/update missing documentation.</p>
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                await signOut()
                router.push('/')
              }}
              className="w-full mt-6 px-4 py-3 rounded-2xl border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm min-h-[192px] flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900">{form.fullName || user.fullName}</h1>
            <p className="text-gray-600 mt-1">{form.email || user.email}</p>
            <p className="text-sm text-gray-500 mt-3">{heading}</p>
            <p className="text-sm mt-2 font-medium">
              Verification: {' '}
              <span className={
                form.verificationStatus === 'verified'
                  ? 'text-green-700'
                  : form.verificationStatus === 'cancelled'
                    ? 'text-red-700'
                    : 'text-accent'
              }>
                {form.verificationStatus === 'verified'
                  ? 'Verified'
                  : form.verificationStatus === 'cancelled'
                    ? 'Cancelled'
                    : 'Pending Review'}
              </span>
            </p>
            {form.verificationStatus === 'cancelled' && form.verificationReason && (
              <p className="text-sm text-red-700 mt-1">Reason: {form.verificationReason}</p>
            )}
          </div>

          <div className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                <p className="text-gray-500">Phone</p>
                <p className="text-gray-800 font-medium mt-1">{form.phone || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                <p className="text-gray-500">Date of Birth</p>
                <p className="text-gray-800 font-medium mt-1">{form.dateOfBirth || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4 md:col-span-2">
                <p className="text-gray-500">Address</p>
                <p className="text-gray-800 font-medium mt-1">{form.address || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                <p className="text-gray-500">ID Type</p>
                <p className="text-gray-800 font-medium mt-1">{form.idType === 'passport' ? 'Passport' : 'Birth Registration'}</p>
              </div>
              <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                <p className="text-gray-500">ID Number</p>
                <p className="text-gray-800 font-medium mt-1">{form.idNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Edit Profile Information</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Address *</label>
                  <textarea name="address" value={form.address} onChange={handleChange} required rows={3} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">ID Type *</label>
                  <select name="idType" value={form.idType} onChange={handleChange} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="birth-registration">Birth Registration</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Birth Registration / Passport Number *</label>
                  <input name="idNumber" value={form.idNumber} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Profile Photo *</label>
                  <input type="file" accept="image/*" onChange={(event) => handleFileChange(event, 'profilePhotoDataUrl')} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">ID Document Photo *</label>
                  <input type="file" accept="image/*" onChange={(event) => handleFileChange(event, 'idDocumentPhotoDataUrl')} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3" />
                </div>

                <div className="md:col-span-2 flex items-center gap-3 pt-2">
                  <button type="submit" className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>

                {saveMessage && <p className="md:col-span-2 text-sm text-green-700">{saveMessage}</p>}
                {saveError && <p className="md:col-span-2 text-sm text-red-700">{saveError}</p>}
              </form>
            </div>
          )}

          <div className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Registered Competitions</h2>
            {registeredCompetitionDetails.length === 0 ? (
              <p className="text-sm text-gray-600">No competition registrations yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredCompetitionDetails.map((competition) => (
                  <div key={competition?.id} className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-gray-900">{competition?.name}</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent capitalize">
                        {competition?.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{competition?.date}</p>
                    <p className="text-sm text-gray-700 mt-3 line-clamp-3">{competition?.description}</p>
                    <p className="text-sm font-semibold text-accent mt-3">{competition?.prize}</p>
                    <p className="text-xs text-gray-500 mt-3">Registered on {new Date(competition?.submittedAt || '').toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
