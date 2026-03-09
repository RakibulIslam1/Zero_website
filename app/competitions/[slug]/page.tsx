'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CompetitionCmsItem } from '@/lib/competitionCms'

function toYoutubeEmbedUrl(url: string) {
  const value = url.trim()
  if (!value) return ''
  const watchMatch = value.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/)
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`
  const shortMatch = value.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/)
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`
  if (value.includes('youtube.com/embed/')) return value
  return ''
}

export default function CompetitionDetailsPage() {
  const params = useParams<{ slug: string }>()
  const slug = String(params.slug || '')
  const [item, setItem] = useState<CompetitionCmsItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    const loadCompetition = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/competitions?slug=${slug}`)
        if (!response.ok) {
          setItem(null)
          return
        }
        const payload = (await response.json()) as { competition?: CompetitionCmsItem }
        setItem(payload.competition ?? null)
      } finally {
        setLoading(false)
      }
    }

    void loadCompetition()
  }, [slug])

  if (loading) {
    return <main className="pt-28 px-4 text-center text-gray-600">Loading competition...</main>
  }

  if (!item) {
    return (
      <main className="pt-28 px-4">
        <div className="max-w-3xl mx-auto rounded-3xl border border-[#e8cfc9] bg-white p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Competition not found</h1>
          <Link href="/competitions" className="inline-flex mt-5 px-6 py-3 rounded-full bg-accent text-white font-semibold">
            Back to competitions
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-24 pb-16">
      <section className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl overflow-hidden border border-[#e8cfc9] bg-white shadow-sm">
          {item.miniBannerImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.miniBannerImageUrl} alt={item.name} className="w-full h-72 object-cover" />
          )}
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-600 mt-2">{item.date}</p>
            <p className="text-gray-700 mt-5 leading-relaxed">{item.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-full bg-[#fff4ef] border border-[#f1d9d2] text-accent text-sm font-medium capitalize">
                {item.status}
              </span>
              {item.prize && (
                <span className="px-3 py-1 rounded-full bg-[#edf9f0] border border-[#cdebd4] text-green-700 text-sm font-medium">
                  {item.prize}
                </span>
              )}
            </div>
            {item.status !== 'completed' && (
              <Link
                href={`/competitions/register/${item.id}`}
                className="inline-flex mt-8 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90"
              >
                Open Admission
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-8 space-y-5">
        {item.pageSections.map((section) => (
          (() => {
            const ytEmbed = toYoutubeEmbedUrl(section.videoUrl || '')
            const textAlignClass =
              section.textAlign === 'center'
                ? 'text-center'
                : section.textAlign === 'right'
                  ? 'text-right'
                  : 'text-left'
            const sectionShellClass =
              section.appearance === 'transparent'
                ? 'rounded-3xl bg-transparent p-2'
                : 'rounded-3xl border border-[#e8cfc9] bg-white p-6 shadow-sm'

            const imageBlock = section.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={section.imageUrl}
                alt={section.heading}
                className="w-full h-72 rounded-2xl object-cover"
                style={{ objectPosition: section.imagePosition || 'center center' }}
              />
            ) : null

            const videoBlock = section.videoUrl ? (
              ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  title={`${section.heading} video`}
                  className="w-full h-72 rounded-2xl border border-[#e8cfc9]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={section.videoUrl}
                  controls
                  className="w-full h-72 rounded-2xl border border-[#e8cfc9] object-cover"
                />
              )
            ) : null

            const textBlock = (
              <div className={`space-y-3 ${textAlignClass}`}>
                <h2 className="text-2xl font-semibold text-gray-900">{section.heading}</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{section.body}</p>
                <div className={`flex flex-wrap gap-3 ${section.textAlign === 'right' ? 'justify-end' : section.textAlign === 'center' ? 'justify-center' : 'justify-start'}`}>
                  {section.linkLabel && section.linkUrl && (
                    <a href={section.linkUrl} target="_blank" rel="noreferrer" className="text-accent font-semibold hover:underline">
                      {section.linkLabel}
                    </a>
                  )}
                  {section.buttonLabel && section.buttonUrl && (
                    <a href={section.buttonUrl} target="_blank" rel="noreferrer" className="inline-flex px-5 py-2.5 rounded-full bg-accent text-white font-semibold hover:bg-accent/90">
                      {section.buttonLabel}
                    </a>
                  )}
                </div>
              </div>
            )

            const leftMedia = section.videoPosition === 'left' ? videoBlock : imageBlock
            const rightMedia = section.videoPosition === 'right' ? videoBlock : section.layout === 'image-right' ? imageBlock : null

            if (section.layout === 'stacked') {
              return (
                <article key={section.id} className={sectionShellClass}>
                  {textBlock}
                  {imageBlock && <div className="mt-4">{imageBlock}</div>}
                  {videoBlock && (section.videoPosition === 'below' || section.videoPosition === 'none') && <div className="mt-4">{videoBlock}</div>}
                </article>
              )
            }

            const isImageLeft = section.layout === 'image-left'
            return (
              <article key={section.id} className={sectionShellClass}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {isImageLeft ? (leftMedia || imageBlock || videoBlock) : textBlock}
                  {isImageLeft ? textBlock : (rightMedia || imageBlock || videoBlock)}
                </div>
                {videoBlock && section.videoPosition === 'below' && <div className="mt-4">{videoBlock}</div>}
              </article>
            )
          })()
        ))}
      </section>
    </main>
  )
}
