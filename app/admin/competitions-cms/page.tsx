'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebaseAuth, getFirebaseStorageClient } from '@/lib/firebase'
import { CompetitionCmsItem, CompetitionPageSection, slugifyCompetitionName } from '@/lib/competitionCms'
import { useAuth } from '@/components/AuthProvider'
import { useNotification } from '@/components/NotificationProvider'

function createEmptyCompetition(): CompetitionCmsItem {
  const now = Date.now()
  return {
    id: 0,
    slug: '',
    name: 'New Competition',
    date: '',
    description: '',
    status: 'upcoming',
    prize: '',
    miniBannerImageUrl: '',
    pageSections: [
      {
        id: `section_${now}`,
        heading: 'Overview',
        body: 'Write competition details here.',
        imageUrl: '',
        imagePosition: 'center center',
        layout: 'stacked',
        textAlign: 'left',
        appearance: 'boxed',
        videoUrl: '',
        videoPosition: 'none',
        linkLabel: '',
        linkUrl: '',
        buttonLabel: '',
        buttonUrl: '',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function uploadImageToStorage(file: File, pathPrefix: string) {
  const storage = getFirebaseStorageClient()
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.')
  }

  const storagePath = `${pathPrefix}/${Date.now()}-${sanitizeFileName(file.name || 'image.jpg')}`
  const fileRef = ref(storage, storagePath)
  await uploadBytes(fileRef, file, { contentType: file.type || 'image/jpeg' })
  return getDownloadURL(fileRef)
}

function reorderSections(sections: CompetitionPageSection[], fromIndex: number, toIndex: number) {
  const next = [...sections]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

function toDateInputValue(value: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

export default function CompetitionsCmsAdminPage() {
  const router = useRouter()
  const { user, loading, isAdmin } = useAuth()
  const { notifyError, notifySuccess } = useNotification()

  const [items, setItems] = useState<CompetitionCmsItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])

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

        const response = await fetch('/api/admin/competitions-cms', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(payload.error || 'Failed to load competitions CMS.')
        }

        const payload = (await response.json()) as { competitions?: CompetitionCmsItem[] }
        const nextItems = payload.competitions ?? []
        setItems(nextItems)
        setSelectedId(nextItems[0]?.id ?? null)
      } catch (error) {
        notifyError(error instanceof Error ? error.message : 'Failed to load competitions CMS.')
      } finally {
        setLoadingData(false)
      }
    }

    void loadData()
  }, [loading, user, isAdmin, notifyError])

  const updateSelected = (updater: (current: CompetitionCmsItem) => CompetitionCmsItem) => {
    setItems((prev) => prev.map((item) => (item.id === selectedId ? updater(item) : item)))
  }

  const handleCreateCompetition = () => {
    const tempId = -(Date.now())
    const draft = { ...createEmptyCompetition(), id: tempId }
    setItems((prev) => [draft, ...prev])
    setSelectedId(tempId)
  }

  const handleDeleteCompetition = async () => {
    if (!selected) return

    if (selected.id <= 0) {
      const nextItems = items.filter((item) => item.id !== selected.id)
      setItems(nextItems)
      setSelectedId(nextItems[0]?.id ?? null)
      return
    }

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) throw new Error('You must be logged in as admin.')

      const response = await fetch('/api/admin/competitions-cms', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: selected.id }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to delete competition.')
      }

      const nextItems = items.filter((item) => item.id !== selected.id)
      setItems(nextItems)
      setSelectedId(nextItems[0]?.id ?? null)
      notifySuccess('Competition deleted successfully.')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to delete competition.')
    }
  }

  const handleMiniBannerChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selected) return

    if (!file.type.startsWith('image/')) {
      notifyError('Please upload an image file.')
      return
    }

    try {
      const uploadedUrl = await uploadImageToStorage(file, `competition-cms/${selected.id > 0 ? selected.id : 'draft'}/mini-banner`)
      updateSelected((current) => ({ ...current, miniBannerImageUrl: uploadedUrl }))
      notifySuccess('Mini banner uploaded.')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to upload image.')
    }
  }

  const handleSectionImageChange = async (sectionId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selected) return

    if (!file.type.startsWith('image/')) {
      notifyError('Please upload an image file.')
      return
    }

    try {
      const uploadedUrl = await uploadImageToStorage(file, `competition-cms/${selected.id > 0 ? selected.id : 'draft'}/sections`)
      updateSelected((current) => ({
        ...current,
        pageSections: current.pageSections.map((section) =>
          section.id === sectionId ? { ...section, imageUrl: uploadedUrl } : section,
        ),
      }))
      notifySuccess('Section image uploaded.')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to upload section image.')
    }
  }

  const handleSaveCompetition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return

    setSaving(true)

    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken(true)
      if (!token) throw new Error('You must be logged in as admin.')

      const response = await fetch('/api/admin/competitions-cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...selected,
          id: selected.id > 0 ? selected.id : undefined,
          slug: selected.slug || slugifyCompetitionName(selected.name),
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to save competition.')
      }

      const payload = (await response.json()) as { id?: number }
      const savedId = Number(payload.id || selected.id)

      setItems((prev) =>
        prev.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                id: savedId,
                slug: item.slug || slugifyCompetitionName(item.name),
              }
            : item,
        ),
      )
      setSelectedId(savedId)
      notifySuccess('Competition saved successfully.')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Failed to save competition.')
    } finally {
      setSaving(false)
    }
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
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="bg-white rounded-3xl p-7 border border-[#e8cfc9] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Competitions CMS</h1>
              <p className="text-sm text-gray-600 mt-1">Create, delete, and design each competition page with drag-and-drop section ordering.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCreateCompetition} className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold">
                New Competition
              </button>
              <button type="button" onClick={() => void handleDeleteCompetition()} disabled={!selected} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                Delete
              </button>
              <Link href="/admin" className="px-4 py-2 rounded-xl border border-[#e8cfc9] text-sm font-semibold text-gray-700 hover:bg-[#fff4ef]">
                Back
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Competitions</h2>
            {loadingData ? (
              <p className="text-sm text-gray-600">Loading competitions...</p>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 ${
                      selectedId === item.id ? 'border-accent bg-[#fff4ef]' : 'border-[#ead3cd] bg-white hover:bg-[#fff4ef]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-600 mt-1">/{item.slug || 'no-slug'}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl border border-[#e8cfc9] shadow-sm p-5 lg:col-span-2">
            {!selected ? (
              <p className="text-sm text-gray-600">Create or select a competition to edit.</p>
            ) : (
              <form onSubmit={handleSaveCompetition} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Competition Name</label>
                    <input
                      type="text"
                      value={selected.name}
                      onChange={(event) => updateSelected((current) => ({ ...current, name: event.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL path)</label>
                    <input
                      type="text"
                      value={selected.slug}
                      onChange={(event) => updateSelected((current) => ({ ...current, slug: event.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                      placeholder={slugifyCompetitionName(selected.name)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={toDateInputValue(selected.date)}
                      onChange={(event) => updateSelected((current) => ({ ...current, date: event.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={selected.status}
                      onChange={(event) => updateSelected((current) => ({ ...current, status: event.target.value as CompetitionCmsItem['status'] }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prize</label>
                    <input
                      type="text"
                      value={selected.prize}
                      onChange={(event) => updateSelected((current) => ({ ...current, prize: event.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Description</label>
                  <textarea
                    rows={3}
                    value={selected.description}
                    onChange={(event) => updateSelected((current) => ({ ...current, description: event.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e8cfc9]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mini Banner (competitions list card)</label>
                  <input type="file" accept="image/*" onChange={(event) => void handleMiniBannerChange(event)} className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white" />
                  {selected.miniBannerImageUrl && (
                    <img src={selected.miniBannerImageUrl} alt="Mini banner" className="mt-3 w-full max-w-sm rounded-xl border border-[#e8cfc9]" />
                  )}
                </div>

                <div className="rounded-xl border border-[#e8cfc9] bg-[#fff9f8] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Competition Page Sections</p>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelected((current) => ({
                          ...current,
                          pageSections: [
                            ...current.pageSections,
                            {
                              id: `section_${Date.now()}`,
                              heading: 'New Section',
                              body: '',
                              imageUrl: '',
                              imagePosition: 'center center',
                              layout: 'stacked',
                              textAlign: 'left',
                              appearance: 'boxed',
                              videoUrl: '',
                              videoPosition: 'none',
                              linkLabel: '',
                              linkUrl: '',
                              buttonLabel: '',
                              buttonUrl: '',
                            },
                          ],
                        }))
                      }
                      className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold"
                    >
                      Add Section
                    </button>
                  </div>

                  {selected.pageSections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragIndex === null || dragIndex === index) return
                        updateSelected((current) => ({
                          ...current,
                          pageSections: reorderSections(current.pageSections, dragIndex, index),
                        }))
                        setDragIndex(null)
                      }}
                      className="rounded-lg border border-[#ead3cd] bg-white p-3 space-y-3 cursor-move"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500">Drag to reorder section</p>
                        <button
                          type="button"
                          onClick={() =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.filter((entry) => entry.id !== section.id),
                            }))
                          }
                          className="px-2 py-1 rounded-md bg-red-600 text-white text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        type="text"
                        value={section.heading}
                        onChange={(event) =>
                          updateSelected((current) => ({
                            ...current,
                            pageSections: current.pageSections.map((entry) =>
                              entry.id === section.id ? { ...entry, heading: event.target.value } : entry,
                            ),
                          }))
                        }
                        placeholder="Section heading"
                        className="w-full px-3 py-2 rounded-lg border border-[#e8cfc9]"
                      />

                      <textarea
                        rows={4}
                        value={section.body}
                        onChange={(event) =>
                          updateSelected((current) => ({
                            ...current,
                            pageSections: current.pageSections.map((entry) =>
                              entry.id === section.id ? { ...entry, body: event.target.value } : entry,
                            ),
                          }))
                        }
                        placeholder="Section content"
                        className="w-full px-3 py-2 rounded-lg border border-[#e8cfc9]"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          value={section.layout}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, layout: event.target.value as CompetitionPageSection['layout'] } : entry,
                              ),
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        >
                          <option value="stacked">Layout: Stacked</option>
                          <option value="image-left">Layout: Image Left / Text Right</option>
                          <option value="image-right">Layout: Text Left / Image Right</option>
                        </select>
                        <select
                          value={section.textAlign}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, textAlign: event.target.value as CompetitionPageSection['textAlign'] } : entry,
                              ),
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        >
                          <option value="left">Text Align: Left</option>
                          <option value="center">Text Align: Center</option>
                          <option value="right">Text Align: Right</option>
                        </select>
                        <select
                          value={section.appearance}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, appearance: event.target.value as CompetitionPageSection['appearance'] } : entry,
                              ),
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        >
                          <option value="boxed">Appearance: Border Box</option>
                          <option value="transparent">Appearance: Transparent</option>
                        </select>
                        <select
                          value={section.videoPosition}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, videoPosition: event.target.value as CompetitionPageSection['videoPosition'] } : entry,
                              ),
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        >
                          <option value="none">Video Position: None</option>
                          <option value="left">Video Position: Left</option>
                          <option value="right">Video Position: Right</option>
                          <option value="below">Video Position: Below</option>
                        </select>
                        <input
                          type="text"
                          value={section.imagePosition}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, imagePosition: event.target.value } : entry,
                              ),
                            }))
                          }
                          placeholder="Image position (e.g. center center)"
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        />
                        <input
                          type="text"
                          value={section.videoUrl}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, videoUrl: event.target.value } : entry,
                              ),
                            }))
                          }
                          placeholder="Video URL (YouTube embed/watch or MP4 URL)"
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        />
                        <input
                          type="text"
                          value={section.linkLabel}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, linkLabel: event.target.value } : entry,
                              ),
                            }))
                          }
                          placeholder="Link label"
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        />
                        <input
                          type="text"
                          value={section.linkUrl}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, linkUrl: event.target.value } : entry,
                              ),
                            }))
                          }
                          placeholder="Link URL"
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        />
                        <input
                          type="text"
                          value={section.buttonLabel}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, buttonLabel: event.target.value } : entry,
                              ),
                            }))
                          }
                          placeholder="Button label"
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        />
                        <input
                          type="text"
                          value={section.buttonUrl}
                          onChange={(event) =>
                            updateSelected((current) => ({
                              ...current,
                              pageSections: current.pageSections.map((entry) =>
                                entry.id === section.id ? { ...entry, buttonUrl: event.target.value } : entry,
                              ),
                            }))
                          }
                          placeholder="Button URL"
                          className="px-3 py-2 rounded-lg border border-[#e8cfc9]"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => void handleSectionImageChange(section.id, event)}
                          className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:font-semibold file:text-white"
                        />
                      </div>

                      {section.imageUrl && (
                        <img
                          src={section.imageUrl}
                          alt={section.heading || 'Section image'}
                          className="w-full h-44 rounded-lg border border-[#e8cfc9] object-cover"
                          style={{ objectPosition: section.imagePosition || 'center center' }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Competition'}
                  </button>
                  <Link href={selected.slug ? `/competitions/${selected.slug}` : '/competitions'} className="px-5 py-2.5 rounded-xl border border-[#e8cfc9] text-sm font-semibold text-gray-700 hover:bg-[#fff4ef]" target="_blank">
                    Preview Page
                  </Link>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
