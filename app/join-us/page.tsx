'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { defaultJoinUsSettings, JoinUsSettings } from '@/lib/joinUs'

type JoinUsFormState = {
  fullName: string
  email: string
  phone: string
  photoDataUrl: string
  answers: Record<string, string>
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
    photoDataUrl: '',
    answers: {},
  })

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

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Image size must be 3MB or less.')
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    }).catch(() => '')

    if (!dataUrl) {
      setError('Failed to process image file.')
      return
    }

    setError('')
    setFormState((prev) => ({
      ...prev,
      photoDataUrl: dataUrl,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!formState.fullName.trim() || !formState.email.trim() || !formState.phone.trim()) {
      setError('Name, email, and phone are required.')
      return
    }

    if (!formState.photoDataUrl) {
      setError('Profile photo is required.')
      return
    }

    for (const fieldId of requiredFieldIds) {
      if (!String(formState.answers[fieldId] || '').trim()) {
        const field = settings.fields.find((entry) => entry.id === fieldId)
        setError(`${field?.label || 'A required field'} is required.`)
        return
      }
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/join-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to submit application.')
      }

      setMessage('Application submitted successfully. We will contact you soon.')
      setFormState({
        fullName: '',
        email: '',
        phone: '',
        photoDataUrl: '',
        answers: {},
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
                    required={!formState.photoDataUrl}
                  />
                </div>
              </div>

              {formState.photoDataUrl && (
                <div className="rounded-2xl border border-[#efd6d1] bg-[#fff9f8] p-3 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formState.photoDataUrl} alt="Applicant preview" className="w-28 h-28 object-cover rounded-xl" />
                </div>
              )}

              {settings.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={formState.answers[field.id] || ''}
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
                  ) : field.type === 'select' ? (
                    <select
                      value={formState.answers[field.id] || ''}
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
                  ) : (
                    <input
                      type={field.type === 'phone' ? 'tel' : field.type}
                      value={formState.answers[field.id] || ''}
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
                  )}
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
