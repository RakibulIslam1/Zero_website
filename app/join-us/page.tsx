'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebaseStorageClient } from '@/lib/firebase'
import {
  defaultJoinUsSettings,
  isJoinUsFileAnswer,
  JoinUsAnswerValue,
  JoinUsFileAnswer,
  JoinUsSettings,
} from '@/lib/joinUs'

type JoinUsPendingFileAnswer = {
  fileName: string
  mimeType: string
  size: number
  file: File
}

type JoinUsLocalAnswerValue = string | JoinUsPendingFileAnswer

type JoinUsFormState = {
  fullName: string
  email: string
  phone: string
  profilePhotoFile: File | null
  profilePhotoPreviewUrl: string
  answers: Record<string, JoinUsLocalAnswerValue>
}

const MAX_DYNAMIC_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_PROFILE_UPLOAD_BYTES = 8 * 1024 * 1024

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function createUploadSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function compressImageFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const maxSide = 1200
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to process uploaded photo.')
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), 'image/jpeg', 0.75)
  })

  if (!blob) {
    throw new Error('Failed to compress uploaded photo.')
  }

  return new File([blob], `${sanitizeFileName(file.name || 'photo')}.jpg`, { type: 'image/jpeg' })
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

export default function JoinUsPage() {
  const [settings, setSettings] = useState<JoinUsSettings>(defaultJoinUsSettings)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formState, setFormState] = useState<JoinUsFormState>({
    fullName: '',
    email: '',
    phone: '',
    profilePhotoFile: null,
    profilePhotoPreviewUrl: '',
    answers: {},
  })

  useEffect(() => {
    return () => {
      if (formState.profilePhotoPreviewUrl) {
        URL.revokeObjectURL(formState.profilePhotoPreviewUrl)
      }
    }
  }, [formState.profilePhotoPreviewUrl])

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/join-us')
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load Join Us form settings.')
        }

        const payload = (await response.json()) as { settings?: JoinUsSettings }
        setSettings(payload.settings || defaultJoinUsSettings)
      } catch (err) {
        const nextError = err instanceof Error ? err.message : 'Failed to load Join Us form settings.'
        setError(nextError)
      } finally {
        setLoading(false)
      }
    }

    void loadSettings()
  }, [])

  const requiredFieldIds = useMemo(
    () => settings.fields.filter((field) => field.required).map((field) => field.id),
    [settings.fields],
  )

  const handleDynamicFileChange = async (fieldId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFormState((prev) => {
        const nextAnswers = { ...prev.answers }
        delete nextAnswers[fieldId]
        return { ...prev, answers: nextAnswers }
      })
      return
    }

    if (file.size > MAX_DYNAMIC_FILE_SIZE_BYTES) {
      setError('Uploaded file is too large. Please keep each dynamic file under 5MB.')
      return
    }

    setError('')
    const nextAnswer: JoinUsPendingFileAnswer = {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      file,
    }

    setFormState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [fieldId]: nextAnswer,
      },
    }))
  }

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    if (file.size > MAX_PROFILE_UPLOAD_BYTES) {
      setError('Image size must be 8MB or less.')
      return
    }

    const compressedFile = await compressImageFile(file).catch(() => null)

    if (!compressedFile) {
      setError('Failed to process image file.')
      return
    }

    const previewUrl = URL.createObjectURL(compressedFile)
    setError('')
    setFormState((prev) => {
      if (prev.profilePhotoPreviewUrl) {
        URL.revokeObjectURL(prev.profilePhotoPreviewUrl)
      }
      return {
        ...prev,
        profilePhotoFile: compressedFile,
        profilePhotoPreviewUrl: previewUrl,
      }
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!formState.fullName.trim() || !formState.email.trim() || !formState.phone.trim()) {
      setError('Name, email, and phone are required.')
      return
    }

    if (!formState.profilePhotoFile) {
      setError('Profile photo is required.')
      return
    }

    for (const fieldId of requiredFieldIds) {
      const field = settings.fields.find((entry) => entry.id === fieldId)
      const value = formState.answers[fieldId]
      const hasValue =
        field?.type === 'file'
          ? Boolean(value && typeof value === 'object' && 'file' in value)
          : Boolean(String(value || '').trim())

      if (!hasValue) {
        setError(`${field?.label || 'A required field'} is required.`)
        return
      }
    }

    setSubmitting(true)

    try {
      const photoUpload = await uploadFileToStorage(formState.profilePhotoFile, 'join-us/profile-photos')

      const preparedAnswers: Record<string, JoinUsAnswerValue> = {}

      for (const field of settings.fields) {
        const value = formState.answers[field.id]
        if (typeof value === 'string') {
          preparedAnswers[field.id] = value
          continue
        }

        if (value && typeof value === 'object' && 'file' in value) {
          const uploaded = await uploadFileToStorage(value.file, 'join-us/attachments')
          const fileAnswer: JoinUsFileAnswer = {
            fileName: value.fileName,
            mimeType: value.mimeType,
            size: value.size,
            downloadUrl: uploaded.downloadUrl,
            storagePath: uploaded.storagePath,
          }
          preparedAnswers[field.id] = fileAnswer
        }
      }

      const response = await fetch('/api/join-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formState.fullName,
          email: formState.email,
          phone: formState.phone,
          photoUrl: photoUpload.downloadUrl,
          photoStoragePath: photoUpload.storagePath,
          answers: preparedAnswers,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to submit application.')
      }

      setMessage('Application submitted successfully. We will contact you soon.')
      setFormState((prev) => {
        if (prev.profilePhotoPreviewUrl) {
          URL.revokeObjectURL(prev.profilePhotoPreviewUrl)
        }
        return {
          fullName: '',
          email: '',
          phone: '',
          profilePhotoFile: null,
          profilePhotoPreviewUrl: '',
          answers: {},
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="rounded-3xl overflow-hidden border border-[#e8cfc9] bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.headerImageDataUrl} alt="Join Us header" className="w-full h-56 object-cover" />
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900">{settings.headerText}</h1>
            <p className="text-gray-600 mt-2">{settings.subheaderText}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#e8cfc9] bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-600">Loading application form...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formState.fullName}
                    onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handlePhotoChange(event)}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-accent/90"
                    required={!formState.profilePhotoFile}
                  />
                </div>
              </div>

              {formState.profilePhotoPreviewUrl && (
                <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-3 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formState.profilePhotoPreviewUrl} alt="Applicant preview" className="w-28 h-28 object-cover rounded-xl" />
                </div>
              )}

              {settings.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>

                  {(() => {
                    const answerValue = formState.answers[field.id]
                    const fileAnswer =
                      answerValue && typeof answerValue === 'object' && 'file' in answerValue
                        ? answerValue
                        : null
                    const textValue = typeof answerValue === 'string' ? answerValue : ''

                    if (field.type === 'textarea') {
                      return (
                        <textarea
                          value={textValue}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              answers: {
                                ...prev.answers,
                                [field.id]: event.target.value,
                              },
                            }))
                          }
                          rows={4}
                          className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                          required={field.required}
                        />
                      )
                    }

                    if (field.type === 'select') {
                      return (
                        <select
                          value={textValue}
                          onChange={(event) =>
                            setFormState((prev) => ({
                              ...prev,
                              answers: {
                                ...prev.answers,
                                [field.id]: event.target.value,
                              },
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                          required={field.required}
                        >
                          <option value="">Select an option</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )
                    }

                    if (field.type === 'file') {
                      return (
                        <div className="space-y-2">
                          <input
                            type="file"
                            onChange={(event) => void handleDynamicFileChange(field.id, event)}
                            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-accent/90"
                            required={field.required && !fileAnswer}
                          />
                          <p className="text-xs text-gray-500">Any file type is supported. Max size: 5MB per field.</p>
                          {fileAnswer && (
                            <p className="text-xs text-green-700">
                              Selected: {fileAnswer.fileName} ({Math.round(fileAnswer.size / 1024)} KB)
                            </p>
                          )}
                        </div>
                      )
                    }

                    return (
                      <input
                        type={field.type === 'phone' ? 'tel' : field.type}
                        value={textValue}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            answers: {
                              ...prev.answers,
                              [field.id]: event.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-2xl border border-[#e8cfc9] focus:outline-none focus:ring-2 focus:ring-accent/30"
                        required={field.required}
                      />
                    )
                  })()}
                </div>
              ))}

              {error && <p className="text-sm text-red-700">{error}</p>}
              {message && <p className="text-sm text-green-700">{message}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-2xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
