'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'
import { competitions } from '@/lib/competitions'
import {
  CompetitionRegistrationApplication,
  createDefaultCompetitionRegistrationSettings,
  CompetitionRegistrationSettings,
} from '@/lib/competitionRegistration'
import { JoinUsField, isJoinUsFileAnswer } from '@/lib/joinUs'
import { useAuth } from '@/components/AuthProvider'
import { useNotification } from '@/components/NotificationProvider'

export default function CompetitionRegistrationAdminPage() {
  const router = useRouter()
  const { user, loading, isAdmin } = useAuth()
  const { notifyError, notifySuccess } = useNotification()

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number>(competitions[0]?.id || 1)
  const [settings, setSettings] = useState<CompetitionRegistrationSettings>(
    createDefaultCompetitionRegistrationSettings(competitions[0]?.id || 1),
  )
  const [applications, setApplications] = useState<CompetitionRegistrationApplication[]>([])
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (loading || !user || !isAdmin) return

    const loadData = async () => {
      setLoadingData(true)

      try {
        const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
        if (!token) {
          throw new Error('You must be logged in as admin.')
        }

        const response = await fetch(`/api/admin/competition-registration?competitionId=${selectedCompetitionId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load competition registration data.')
        }

        const payload = (await response.json()) as {
          settings?: CompetitionRegistrationSettings
          applications?: CompetitionRegistrationApplication[]
        }

        setSettings(payload.settings || createDefaultCompetitionRegistrationSettings(selectedCompetitionId))
        const nextItems = payload.applications ?? []
        setApplications(nextItems)
        setSelectedApplicationId(nextItems[0]?.id || '')
      } catch (error) {
        notifyError(error instanceof Error ? error.message : 'Failed to load competition registration data.')
      } finally {
        setLoadingData(false)
      }
    }

    void loadData()
  }, [loading, user, isAdmin, selectedCompetitionId, notifyError])

  const selectedApplication = useMemo(
    () => applications.find((entry) => entry.id === selectedApplicationId) ?? null,
    [applications, selectedApplicationId],
  )

  const handleFieldChange = <K extends keyof JoinUsField>(index: number, key: K, value: JoinUsField[K]) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, [key]: value } : field)),
    }))
  }

  const handleAddField = () => {
    setSettings((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: `field_${Date.now()}`,
          label: 'New Field',
          type: 'text',
          required: false,
          options: [],
        },
      ],
    }))
  }

  const handleRemoveField = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, fieldIndex) => fieldIndex !== index),
    }))
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) {
        throw new Error('You must be logged in as admin.')
      }

      const response = await fetch('/api/admin/competition-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to save settings.')
      }

      notifySuccess('Competition registration form updated successfully.')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Submitted At', ...settings.fields.map((field) => field.label)]
    const rows = applications.map((entry) => {
      const answers = settings.fields.map((field) => {
        const value = entry.answers?.[field.id]
        if (isJoinUsFileAnswer(value)) {
          return value.fileName || 'Uploaded file'
        }
        return String(value || '')
      })

      return [
        String(entry.fullName || ''),
        String(entry.email || ''),
        String(entry.phone || ''),
        new Date(entry.createdAt || 0).toLocaleString(),
        ...answers,
      ]
    })

    const csv = [header, ...rows]
      .map((cells) => cells.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `competition-${selectedCompetitionId}-registrations.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <main className="pt-28 px-4 text-center text-gray-600">Checking admin access...</main>
  }

  if (!user || !isAdmin) {
    return (
      <main className="pt-28 px-4">
        <div className="max-w-3xl mx-auto rounded-3xl border border-[#e8cfc9] bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Access Required</h1>
          <Link href="/admin" className="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold">
            Back to Admin
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Competition Registration Forms</h1>
              <p className="text-sm text-gray-600 mt-1">Create separate registration forms and view submissions for each competition.</p>
            </div>
            <Link href="/admin" className="px-4 py-2 rounded-xl border border-[#e8cfc9] text-sm font-semibold text-gray-700 hover:bg-[#fff4ef]">
              Back to Admin
            </Link>
          </div>

          <div className="mt-5 max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Competition</label>
            <select
              value={selectedCompetitionId}
              onChange={(event) => setSelectedCompetitionId(Number(event.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
            >
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          {loadingData ? (
            <p className="text-sm text-gray-600">Loading competition form settings...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Header</label>
                <input
                  type="text"
                  value={settings.headerText}
                  onChange={(event) => setSettings((prev) => ({ ...prev, headerText: event.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subheader</label>
                <textarea
                  rows={2}
                  value={settings.subheaderText}
                  onChange={(event) => setSettings((prev) => ({ ...prev, subheaderText: event.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                />
              </div>

              <div className="rounded-xl border border-[#e8cfc9] bg-[#fff9f8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Form Fields</p>
                  <button type="button" onClick={handleAddField} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold">
                    Add Field
                  </button>
                </div>

                {settings.fields.map((field, index) => (
                  <div key={`competition-field-${index}`} className="rounded-lg border border-[#ead3cd] bg-white p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(event) => handleFieldChange(index, 'label', event.target.value)}
                        placeholder="Field label"
                        className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                      />
                      <select
                        value={field.type}
                        onChange={(event) => handleFieldChange(index, 'type', event.target.value as JoinUsField['type'])}
                        className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Dropdown</option>
                        <option value="file">File Upload</option>
                      </select>
                      <input
                        type="text"
                        value={field.id}
                        onChange={(event) => handleFieldChange(index, 'id', event.target.value.replace(/\s+/g, '_').toLowerCase())}
                        placeholder="Variable Name"
                        className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                      />
                    </div>

                    {field.type === 'select' && (
                      <input
                        type="text"
                        value={field.options.join(', ')}
                        onChange={(event) => handleFieldChange(index, 'options', event.target.value.split(',').map((item) => item.trim()))}
                        placeholder="Option 1, Option 2"
                        className="w-full px-3 py-2 rounded-lg border border-[#e8cfc9]"
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) => handleFieldChange(index, 'required', event.target.checked)}
                        />
                        Required
                      </label>
                      <button type="button" onClick={() => handleRemoveField(index)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Form'}
              </button>
            </form>
          )}
        </section>

        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Competition Applications ({applications.length})</h2>
            <button type="button" onClick={handleDownloadCsv} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold">
              Download CSV
            </button>
          </div>

          {applications.length === 0 ? (
            <p className="text-sm text-gray-600 mt-3">No registrations for this competition yet.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {applications.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedApplicationId(entry.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 ${
                      selectedApplicationId === entry.id
                        ? 'border-accent bg-[#fff4ef]'
                        : 'border-[#ead3cd] bg-white hover:bg-[#fff4ef]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{entry.fullName}</p>
                    <p className="text-xs text-gray-600 mt-1">{entry.email}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-[#ead3cd] bg-white p-3">
                {!selectedApplication ? (
                  <p className="text-sm text-gray-600">Select an application to view details.</p>
                ) : (
                  <div className="space-y-2">
                    {settings.fields.map((field) => {
                      const value = selectedApplication.answers?.[field.id]
                      const fileValue = isJoinUsFileAnswer(value) ? value : null
                      return (
                        <div key={field.id} className="rounded-lg border border-[#f0d9d4] bg-[#fff9f8] px-3 py-2">
                          <p className="text-xs font-semibold text-gray-600">{field.label}</p>
                          {fileValue ? (
                            <a
                              href={fileValue.downloadUrl || fileValue.dataUrl}
                              download={fileValue.fileName}
                              className="text-sm text-accent font-semibold hover:underline"
                            >
                              Download {fileValue.fileName}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-800">{String(value || 'Not answered')}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
