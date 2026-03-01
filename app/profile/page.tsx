'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, type UserProfile } from '@/components/AuthProvider'
import { competitions } from '@/lib/competitions'

function compressImageToDataUrl(
  file: File,
  maxWidth = 700,
  maxHeight = 700,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not available'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = objectUrl
  })
}

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  phone: '',
  educationLevel: '',
  instituteName: '',
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

  if (
    message.includes('invalid-argument') ||
    message.includes('exceeds the maximum allowed size') ||
    message.includes('too large') ||
    message.includes('maximum size')
  ) {
    return 'Could not save: the uploaded images are still too large after compression. Please use smaller photos (under 500 KB each).'
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

  const missingItems = useMemo(() => {
    const missing: string[] = []
    if (!form.phone) missing.push('Phone number')
    if (!form.educationLevel) missing.push('Education level')
    if (!form.instituteName) missing.push('Institute name')
    if (!form.address) missing.push('Address')
    if (!form.dateOfBirth) missing.push('Date of birth')
    if (!form.idNumber) missing.push('Birth registration / passport number')
    if (!form.profilePhotoDataUrl) missing.push('Profile photo')
    if (!form.idDocumentPhotoDataUrl) missing.push('ID document photo')
    return missing
  }, [form])

  const heading = useMemo(() => {
    if (isProfileComplete) return 'Your Profile'
    return 'Complete Your Profile'
  }, [isProfileComplete])

  const profileStatusLine = useMemo(() => {
    if (isProfileComplete) return 'Profile complete.'
    return `Profile information remaining: ${missingItems.length} item${missingItems.length === 1 ? '' : 's'}.`
  }, [isProfileComplete, missingItems.length])

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

    // Reject completely unusable files early (>10 MB)
    const maxSizeInBytes = 10 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      setSaveError('Image is too large to process. Please use an image under 10 MB.')
      return
    }

    setSaveError('')
    try {
      // Compress & resize to JPEG ≤700×700 @ 0.75 quality → stays well under Firestore 1 MB limit
      const dataUrl = await compressImageToDataUrl(file)
      setForm((prev) => ({ ...prev, [field]: dataUrl }))
    } catch {
      setSaveError('Could not process the image. Please try a different file.')
    }
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
            <div className="w-56 h-56 rounded-full overflow-hidden bg-[#f4d8d2] flex items-center justify-center text-accent font-semibold text-5xl mx-auto border-4 border-[#f1d3cc]">
              {(form.profilePhotoDataUrl || user.avatarDataUrl) ? (
                <Image src={form.profilePhotoDataUrl || user.avatarDataUrl || ''} alt={user.fullName} width={224} height={224} className="w-full h-full object-cover" />
              ) : (
                user.fullName.slice(0, 1).toUpperCase()
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Registered Competitions</h3>
              {registeredCompetitionDetails.length === 0 ? (
                <p className="text-sm text-gray-600">No competition registrations yet.</p>
              ) : (
                <ul className="space-y-2">
                  {registeredCompetitionDetails.map((competition) => (
                    <li key={competition?.id} className="text-sm text-gray-700">
                      {competition?.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditMode((current) => !current)}
              className="w-full mt-6 px-4 py-3 rounded-2xl border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors"
            >
              {editMode ? 'Close Edit Profile' : 'Edit Profile'}
            </button>

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
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className={`text-sm font-medium ${isProfileComplete ? 'text-green-700' : 'text-accent'}`}>{profileStatusLine}</p>
              <button
                type="button"
                onClick={() => {
                  setEditMode(true)
                  setTimeout(() => {
                    document.getElementById('edit-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 80)
                }}
                className="inline-flex px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Update Information
              </button>
            </div>
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
                <p className="text-gray-500">Education Level</p>
                <p className="text-gray-800 font-medium mt-1">{form.educationLevel || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4 md:col-span-2">
                <p className="text-gray-500">Institute Name</p>
                <p className="text-gray-800 font-medium mt-1">{form.instituteName || 'Not provided'}</p>
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
            <div id="edit-profile" className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
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
                  <label className="text-sm font-medium text-gray-700">Education Level *</label>
                  <input name="educationLevel" value={form.educationLevel} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Institute Name *</label>
                  <input name="instituteName" value={form.instituteName} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
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

        </section>
      </div>
    </div>
  )
}
