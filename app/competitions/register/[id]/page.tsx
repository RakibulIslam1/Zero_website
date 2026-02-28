'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { competitions } from '@/lib/competitions'
import { useAuth } from '@/components/AuthProvider'

export default function CompetitionRegisterPage() {
  const params = useParams<{ id: string }>()
  const competitionId = Number(params.id)
  const competition = competitions.find((item) => item.id === competitionId)

  const {
    user,
    profile,
    isProfileComplete,
    addRegistration,
    isRegisteredForCompetition,
  } = useAuth()

  const [form, setForm] = useState({
    teamName: '',
    instituteName: '',
    emergencyContact: '',
    note: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const alreadyRegistered = useMemo(
    () => isRegisteredForCompetition(competitionId),
    [competitionId, isRegisteredForCompetition]
  )

  if (!competition) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Competition not found</h1>
          <Link href="/competitions" className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
            Back to competitions
          </Link>
        </div>
      </div>
    )
  }

  if (competition.status === 'completed') {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Registration closed</h1>
          <p className="text-gray-600 mb-6">This competition is completed. New registration is not available.</p>
          <Link href="/competitions" className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
            Back to competitions
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Login required</h1>
          <p className="text-gray-600 mb-6">You need to sign in before registering for competitions.</p>
          <Link href="/login" className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
            Sign in now
          </Link>
        </div>
      </div>
    )
  }

  if (!isProfileComplete || !profile) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete your profile first</h1>
          <p className="text-gray-600 mb-6">
            Birth registration/passport info, number, photo, address, and profile details are required before registration.
          </p>
          <Link href="/profile" className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
            Go to profile
          </Link>
        </div>
      </div>
    )
  }

  if (alreadyRegistered || submitted) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Registration complete</h1>
          <p className="text-gray-600 mb-6">You are registered for {competition.name}.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/profile" className="inline-flex px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
              View profile
            </Link>
            <Link href="/competitions" className="inline-flex px-6 py-3 rounded-full border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors">
              Back to competitions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)

    try {
      await addRegistration({
        competitionId: competition.id,
        competitionName: competition.name,
        competitionDate: competition.date,
        teamName: form.teamName,
        instituteName: form.instituteName,
        emergencyContact: form.emergencyContact,
        note: form.note,
        submittedAt: new Date().toISOString(),
      })
      setSubmitted(true)
    } catch {
      setSubmitError('Could not submit registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Registration</h1>
        <p className="text-gray-700 font-medium">{competition.name}</p>
        <p className="text-gray-600 mb-8">{competition.date}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Team / Participant Name *</label>
            <input name="teamName" value={form.teamName} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">School / College / Institute *</label>
            <input name="instituteName" value={form.instituteName} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Emergency Contact Number *</label>
            <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Additional Note</label>
            <textarea name="note" value={form.note} onChange={handleChange} rows={4} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors disabled:opacity-70">
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
            <Link href="/competitions" className="px-6 py-3 rounded-full border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors">
              Cancel
            </Link>
          </div>

          {submitError && <p className="text-sm text-red-700">{submitError}</p>}
        </form>
      </div>
    </div>
  )
}
