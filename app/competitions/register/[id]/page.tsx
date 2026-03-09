'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { competitions } from '@/lib/competitions'
import { useAuth } from '@/components/AuthProvider'
import { useNotification } from '@/components/NotificationProvider'
import { getFirebaseAuth, getFirebaseStorageClient } from '@/lib/firebase'
import {
  CompetitionRegistrationSettings,
  createDefaultCompetitionRegistrationSettings,
} from '@/lib/competitionRegistration'
import { JoinUsAnswerValue, JoinUsFileAnswer, isJoinUsFileAnswer } from '@/lib/joinUs'

type PendingFileAnswer = {
  fileName: string
  mimeType: string
  size: number
  file: File
}

type LocalAnswerValue = string | PendingFileAnswer

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function createUploadSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function uploadFileToStorage(file: File, pathPrefix: string) {
  const storage = getFirebaseStorageClient()
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.')
  }

  const safeName = sanitizeFileName(file.name || 'upload.bin')
  const storagePath = `${pathPrefix}/${createUploadSuffix()}-${safeName}`
  const fileRef = ref(storage, storagePath)
  await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/octet-stream',
  })
  const downloadUrl = await getDownloadURL(fileRef)
  return { downloadUrl, storagePath }
}

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
  const { notifyError, notifySuccess } = useNotification()

  const [settings, setSettings] = useState<CompetitionRegistrationSettings>(
    createDefaultCompetitionRegistrationSettings(competitionId || 1),
  )
  const [answers, setAnswers] = useState<Record<string, LocalAnswerValue>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const alreadyRegistered = useMemo(
    () => isRegisteredForCompetition(competitionId),
    [competitionId, isRegisteredForCompetition]
  )

  useEffect(() => {
    if (!competitionId) return

    const loadSettings = async () => {
      setLoadingSettings(true)
      try {
        const response = await fetch(`/api/competition-registration?competitionId=${competitionId}`)
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load competition registration form.')
        }

        const payload = (await response.json()) as { settings?: CompetitionRegistrationSettings }
        setSettings(payload.settings || createDefaultCompetitionRegistrationSettings(competitionId))
      } catch (error) {
        notifyError(error instanceof Error ? error.message : 'Failed to load competition registration form.')
      } finally {
        setLoadingSettings(false)
      }
    }

    void loadSettings()
  }, [competitionId, notifyError])

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
            Birth registration/passport/NID info, number, photo, address, and profile details are required before registration.
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

  const handleTextAnswerChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleFileAnswerChange = async (fieldId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notifyError('File is too large. Keep each file under 5MB.')
      return
    }

    setAnswers((prev) => ({
      ...prev,
      [fieldId]: {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        file,
      },
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      for (const field of settings.fields) {
        if (!field.required) continue
        const value = answers[field.id]
        const hasValue =
          value && typeof value === 'object'
            ? true
            : Boolean(String(value || '').trim())

        if (!hasValue) {
          throw new Error(`${field.label} is required.`)
        }
      }

      const preparedAnswers: Record<string, JoinUsAnswerValue> = {}

      for (const field of settings.fields) {
        const value = answers[field.id]
        if (typeof value === 'string') {
          preparedAnswers[field.id] = value
          continue
        }

        if (value && typeof value === 'object' && 'file' in value) {
          const uploaded = await uploadFileToStorage(value.file, `competition-registration/${competition.id}`)
          const nextFileAnswer: JoinUsFileAnswer = {
            fileName: value.fileName,
            mimeType: value.mimeType,
            size: value.size,
            downloadUrl: uploaded.downloadUrl,
            storagePath: uploaded.storagePath,
          }
          preparedAnswers[field.id] = nextFileAnswer
        }
      }

      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in to submit registration.')
      }

      const response = await fetch('/api/competition-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          competitionId: competition.id,
          answers: preparedAnswers,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Could not submit registration. Please try again.')
      }

      await addRegistration({
        competitionId: competition.id,
        competitionName: competition.name,
        competitionDate: competition.date,
        teamName: String(preparedAnswers.team_name || user.fullName || ''),
        instituteName: String(preparedAnswers.institute_name || profile.instituteName || ''),
        emergencyContact: String(preparedAnswers.emergency_contact || profile.phone || ''),
        note: String(preparedAnswers.note || ''),
        submittedAt: new Date().toISOString(),
      })

      setSubmitted(true)
      notifySuccess('Registration submitted successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit registration. Please try again.'
      notifyError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-[#e8cfc9] shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{settings.headerText}</h1>
        <p className="text-gray-700 font-medium">{competition.name}</p>
        <p className="text-gray-600">{competition.date}</p>
        <p className="text-gray-600 mb-8 mt-2">{settings.subheaderText}</p>

        {loadingSettings ? (
          <p className="text-sm text-gray-600">Loading registration form...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {settings.fields.map((field) => {
              const value = answers[field.id]
              const fileValue = value && typeof value === 'object' && 'file' in value ? value : null
              const textValue = typeof value === 'string' ? value : ''

              return (
                <div key={field.id}>
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={textValue}
                      onChange={(event) => handleTextAnswerChange(field.id, event.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={textValue}
                      onChange={(event) => handleTextAnswerChange(field.id, event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                      required={field.required}
                    >
                      <option value="">Select an option</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'file' ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="file"
                        onChange={(event) => void handleFileAnswerChange(field.id, event)}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-accent/90"
                        required={field.required && !fileValue}
                      />
                      {fileValue && (
                        <p className="text-xs text-green-700">Selected: {fileValue.fileName} ({Math.round(fileValue.size / 1024)} KB)</p>
                      )}
                    </div>
                  ) : (
                    <input
                      type={field.type === 'phone' ? 'tel' : field.type}
                      value={textValue}
                      onChange={(event) => handleTextAnswerChange(field.id, event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                      required={field.required}
                    />
                  )}
                </div>
              )
            })}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors disabled:opacity-70">
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
              <Link href="/competitions" className="px-6 py-3 rounded-full border border-[#e8cfc9] text-gray-700 font-semibold hover:bg-[#f8dfda] transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
