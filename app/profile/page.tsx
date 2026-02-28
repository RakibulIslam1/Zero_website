'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, type UserProfile } from '@/components/AuthProvider'

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
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, registrations, updateProfile, isProfileComplete, signOut } = useAuth()
  const [form, setForm] = useState<UserProfile>(profile ?? emptyProfile)
  const [saving, setSaving] = useState(false)

  const heading = useMemo(() => {
    if (isProfileComplete) return 'Your Profile'
    return 'Complete Your Profile'
  }, [isProfileComplete])

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

    const dataUrl = await fileToDataUrl(file)
    setForm((prev) => ({ ...prev, [field]: dataUrl }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    updateProfile(form)
    setTimeout(() => setSaving(false), 500)
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#e8cfc9] shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{heading}</h1>
          <p className="text-gray-600 mb-8">
            For olympiad participation, profile photo and ID information are mandatory before competition registration.
          </p>

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
              <button type="button" onClick={() => { signOut(); router.push('/') }} className="px-6 py-3 rounded-full border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors">
                Sign Out
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="bg-white rounded-3xl p-6 border border-[#e8cfc9] shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f4d8d2] flex items-center justify-center text-accent font-semibold">
                {(form.profilePhotoDataUrl || user.avatarDataUrl) ? (
                  <Image src={form.profilePhotoDataUrl || user.avatarDataUrl || ''} alt={user.fullName} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.slice(0, 1).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700">
              Profile status: <span className={isProfileComplete ? 'text-green-700' : 'text-accent'}>{isProfileComplete ? 'Complete' : 'Incomplete'}</span>
            </p>
          </section>

          <section className="bg-white rounded-3xl p-6 border border-[#e8cfc9] shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Registered Competitions</h2>
            {registrations.length === 0 ? (
              <p className="text-sm text-gray-600">No competition registrations yet.</p>
            ) : (
              <ul className="space-y-3">
                {registrations.map((registration) => (
                  <li key={registration.competitionId} className="rounded-xl border border-[#f0d9d4] p-3">
                    <p className="font-semibold text-gray-900">{registration.competitionName}</p>
                    <p className="text-sm text-gray-600">{registration.competitionDate}</p>
                    <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(registration.submittedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
