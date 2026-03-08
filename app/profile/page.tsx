'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useAuth, type UserProfile } from '@/components/AuthProvider'
import { useNotification } from '@/components/NotificationProvider'
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

async function createProfileCroppedDataUrl(
  sourceDataUrl: string,
  zoom: number,
  panX: number,
  panY: number,
): Promise<string> {
  const previewSize = 224
  const outputSize = 700
  const img = new window.Image()

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image for framing'))
    img.src = sourceDataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not available')
  }

  const baseScale = Math.max(outputSize / img.width, outputSize / img.height)
  const drawWidth = img.width * baseScale * zoom
  const drawHeight = img.height * baseScale * zoom
  const previewToOutputRatio = outputSize / previewSize

  const preferredX = (outputSize - drawWidth) / 2 + panX * previewToOutputRatio
  const preferredY = (outputSize - drawHeight) / 2 + panY * previewToOutputRatio

  const minX = outputSize - drawWidth
  const minY = outputSize - drawHeight
  const drawX = Math.min(0, Math.max(minX, preferredX))
  const drawY = Math.min(0, Math.max(minY, preferredY))

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  return canvas.toDataURL('image/jpeg', 0.82)
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

function getIdTypeLabel(idType: UserProfile['idType']) {
  if (idType === 'passport') return 'Passport'
  if (idType === 'nid') return 'NID'
  return 'Birth Registration'
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

  if (message.includes('must be an image file')) {
    return 'Only image files are allowed for profile photo and ID document.'
  }

  if (message.includes('Image is too large after processing')) {
    return 'One of your images is still too large after compression. Please upload a smaller image.'
  }

  return 'Could not save profile. Please try again.'
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, registrations, updateProfile, isProfileComplete, signOut } = useAuth()
  const { notifyError, notifySuccess } = useNotification()
  const [form, setForm] = useState<UserProfile>(profile ?? emptyProfile)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profilePhotoSourceDataUrl, setProfilePhotoSourceDataUrl] = useState('')
  const [profilePhotoZoom, setProfilePhotoZoom] = useState(1)
  const [profilePhotoPanX, setProfilePhotoPanX] = useState(0)
  const [profilePhotoPanY, setProfilePhotoPanY] = useState(0)
  const dragStateRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    basePanX: 0,
    basePanY: 0,
  })
  const pinchDistanceRef = useRef<number | null>(null)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)

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
    if (!form.idNumber) missing.push('Birth registration / passport / NID number')
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

  const openEditProfileSection = () => {
    setEditMode(true)
    setTimeout(() => {
      document.getElementById('edit-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

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

  const handleIdDocumentPhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      notifyError('Only image files are allowed (JPG, PNG, WEBP, etc). PDF or other file types are not accepted.')
      return
    }

    // Reject completely unusable files early (>10 MB)
    const maxSizeInBytes = 10 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      notifyError('Image is too large to process. Please use an image under 10 MB.')
      return
    }

    try {
      // Compress & resize to JPEG ≤700×700 @ 0.75 quality → stays well under Firestore 1 MB limit
      const dataUrl = await compressImageToDataUrl(file)
      setForm((prev) => ({ ...prev, idDocumentPhotoDataUrl: dataUrl }))
    } catch {
      notifyError('Could not process the image. Please try a different file.')
    }
  }

  const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      notifyError('Only image files are allowed (JPG, PNG, WEBP, etc).')
      return
    }

    const maxSizeInBytes = 10 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      notifyError('Image is too large to process. Please use an image under 10 MB.')
      return
    }

    try {
      const sourceDataUrl = await readFileAsDataUrl(file)
      setProfilePhotoSourceDataUrl(sourceDataUrl)
      setProfilePhotoZoom(1)
      setProfilePhotoPanX(0)
      setProfilePhotoPanY(0)
      notifySuccess('Preview ready. Drag and zoom to reframe, then set the photo.')
    } catch {
      notifyError('Could not process the selected image. Please try another one.')
    }
  }

  const clampPan = (value: number) => Math.max(-140, Math.min(140, value))
  const clampZoom = (value: number) => Math.max(1, Math.min(2.6, value))

  const handleProfilePreviewWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const delta = -event.deltaY * 0.0015
    setProfilePhotoZoom((prev) => clampZoom(prev + delta))
  }

  const handleProfilePreviewPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      basePanX: profilePhotoPanX,
      basePanY: profilePhotoPanY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleProfilePreviewPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    setProfilePhotoPanX(clampPan(dragState.basePanX + deltaX))
    setProfilePhotoPanY(clampPan(dragState.basePanY + deltaY))
  }

  const handleProfilePreviewPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (dragStateRef.current.pointerId === event.pointerId) {
      dragStateRef.current.active = false
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleProfilePreviewTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation()

    if (event.touches.length === 2) {
      const [first, second] = [event.touches[0], event.touches[1]]
      const dx = first.clientX - second.clientX
      const dy = first.clientY - second.clientY
      pinchDistanceRef.current = Math.hypot(dx, dy)
    }
  }

  const handleProfilePreviewTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || pinchDistanceRef.current === null) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    const [first, second] = [event.touches[0], event.touches[1]]
    const dx = first.clientX - second.clientX
    const dy = first.clientY - second.clientY
    const distance = Math.hypot(dx, dy)
    const change = (distance - pinchDistanceRef.current) * 0.008
    pinchDistanceRef.current = distance
    setProfilePhotoZoom((prev) => clampZoom(prev + change))
  }

  const handleProfilePreviewTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation()

    if (event.touches.length < 2) {
      pinchDistanceRef.current = null
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      let nextForm = form

      // If user uploaded a new source image for preview/reframe, apply it automatically on save.
      if (profilePhotoSourceDataUrl) {
        const framedProfilePhoto = await createProfileCroppedDataUrl(
          profilePhotoSourceDataUrl,
          profilePhotoZoom,
          profilePhotoPanX,
          profilePhotoPanY,
        )

        nextForm = {
          ...form,
          profilePhotoDataUrl: framedProfilePhoto,
        }
        setForm(nextForm)
        setProfilePhotoSourceDataUrl('')
      }

      await updateProfile(nextForm)
      notifySuccess('Profile saved successfully.')
      setEditMode(false)
    } catch (error) {
      notifyError(toFriendlyError(error))
    } finally {
      setTimeout(() => setSaving(false), 350)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 border border-[#e8cfc9] shadow-sm">
            <div className="relative w-56 h-56 mx-auto">
              <div className="w-56 h-56 rounded-full overflow-hidden bg-[#f4d8d2] flex items-center justify-center text-accent font-semibold text-5xl border-4 border-[#f1d3cc]">
                {(form.profilePhotoDataUrl || user.avatarDataUrl) ? (
                  <Image src={form.profilePhotoDataUrl || user.avatarDataUrl || ''} alt={user.fullName} width={224} height={224} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.slice(0, 1).toUpperCase()
                )}
              </div>

              {editMode && (
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow hover:bg-accent/90"
                  aria-label="Upload profile photo"
                  title="Upload profile photo"
                >
                  <Plus size={20} />
                </button>
              )}
            </div>

            {editMode && (
              <>
                <input
                  ref={profilePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />

                {profilePhotoSourceDataUrl ? (
                  <div className="mt-5 rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Profile Photo Demo</p>
                    <p className="text-xs text-gray-500">Drag to reframe. Use touchpad/mouse wheel or pinch to zoom. Saving profile will apply this framing automatically.</p>

                    <div
                      className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-[#f1d3cc] bg-[#f4d8d2] relative touch-none overscroll-contain"
                      onWheel={handleProfilePreviewWheel}
                      onWheelCapture={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                      onPointerDown={handleProfilePreviewPointerDown}
                      onPointerMove={handleProfilePreviewPointerMove}
                      onPointerUp={handleProfilePreviewPointerUp}
                      onPointerCancel={handleProfilePreviewPointerUp}
                      onTouchStart={handleProfilePreviewTouchStart}
                      onTouchMove={handleProfilePreviewTouchMove}
                      onTouchEnd={handleProfilePreviewTouchEnd}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profilePhotoSourceDataUrl}
                        alt="Profile photo preview"
                        className="absolute top-1/2 left-1/2 w-full h-full object-cover select-none"
                        draggable={false}
                        style={{
                          transform: `translate(calc(-50% + ${profilePhotoPanX}px), calc(-50% + ${profilePhotoPanY}px)) scale(${profilePhotoZoom})`,
                          transformOrigin: 'center center',
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePhotoZoom(1)
                          setProfilePhotoPanX(0)
                          setProfilePhotoPanY(0)
                        }}
                        className="px-4 py-2 rounded-xl border border-[#e8cfc9] text-sm font-semibold text-gray-700 hover:bg-[#f8dfda]"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-gray-500">Click the plus icon on your photo to upload and reframe.</p>
                )}
              </>
            )}

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
              onClick={openEditProfileSection}
              className="w-full mt-6 px-4 py-3 rounded-2xl border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors"
            >
              Edit Profile
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
          {!editMode && (
            <>
              <div className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm min-h-[192px] flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900">{form.fullName || user.fullName}</h1>
            <p className="text-gray-600 mt-1">{form.email || user.email}</p>
            <p className="text-sm text-gray-500 mt-3">{heading}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className={`text-sm font-medium ${isProfileComplete ? 'text-green-700' : 'text-accent'}`}>{profileStatusLine}</p>
              <button
                type="button"
                onClick={openEditProfileSection}
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
                <p className="text-gray-800 font-medium mt-1">{getIdTypeLabel(form.idType)}</p>
              </div>
              <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-4">
                <p className="text-gray-500">ID Number</p>
                <p className="text-gray-800 font-medium mt-1">{form.idNumber || 'Not provided'}</p>
              </div>
            </div>
              </div>
            </>
          )}

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
                    <option value="nid">NID</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Birth Registration / Passport / NID Number *</label>
                  <input name="idNumber" value={form.idNumber} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">ID Document Photo *</label>
                  <input type="file" accept="image/*" onChange={handleIdDocumentPhotoChange} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3" />
                </div>

                <div className="md:col-span-2 flex items-center gap-3 pt-2">
                  <button type="submit" className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </section>
      </div>
    </div>
  )
}
