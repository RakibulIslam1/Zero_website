import { competitions as staticCompetitions, CompetitionStatus } from '@/lib/competitions'

export type CompetitionCmsStatus = CompetitionStatus

export type CompetitionPageSection = {
  id: string
  heading: string
  body: string
  imageUrl: string
  imagePosition: string
  layout: 'stacked' | 'image-left' | 'image-right'
  textAlign: 'left' | 'center' | 'right'
  appearance: 'boxed' | 'transparent'
  videoUrl: string
  videoPosition: 'none' | 'left' | 'right' | 'below'
  linkLabel: string
  linkUrl: string
  buttonLabel: string
  buttonUrl: string
}

export type CompetitionCmsItem = {
  id: number
  slug: string
  name: string
  date: string
  description: string
  status: CompetitionCmsStatus
  prize: string
  miniBannerImageUrl: string
  pageSections: CompetitionPageSection[]
  createdAt: number
  updatedAt: number
}

export function slugifyCompetitionName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function defaultSections(name: string, description: string): CompetitionPageSection[] {
  return [
    {
      id: `section_${Date.now()}`,
      heading: `${name} Overview`,
      body: description || 'Describe this competition details, rules, and timeline.',
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
  ]
}

export function normalizeCompetitionCmsItem(input: Record<string, unknown>, fallbackId: number): CompetitionCmsItem {
  const name = String(input.name || `Competition ${fallbackId}`)
  const description = String(input.description || '')
  const slug = String(input.slug || slugifyCompetitionName(name) || `competition-${fallbackId}`)
  const sectionsRaw = Array.isArray(input.pageSections) ? input.pageSections : defaultSections(name, description)

  const pageSections = sectionsRaw
    .map((entry, index) => {
      const section = entry as Record<string, unknown>
      return {
        id: String(section.id || `section_${index + 1}`),
        heading: String(section.heading || `Section ${index + 1}`),
        body: String(section.body || ''),
        imageUrl: String(section.imageUrl || ''),
        imagePosition: String(section.imagePosition || 'center center'),
        layout: (String(section.layout || 'stacked') as CompetitionPageSection['layout']),
        textAlign: (String(section.textAlign || 'left') as CompetitionPageSection['textAlign']),
        appearance: (String(section.appearance || 'boxed') as CompetitionPageSection['appearance']),
        videoUrl: String(section.videoUrl || ''),
        videoPosition: (String(section.videoPosition || 'none') as CompetitionPageSection['videoPosition']),
        linkLabel: String(section.linkLabel || ''),
        linkUrl: String(section.linkUrl || ''),
        buttonLabel: String(section.buttonLabel || ''),
        buttonUrl: String(section.buttonUrl || ''),
      }
    })
    .filter((section) => section.id)

  return {
    id: Number(input.id || fallbackId),
    slug,
    name,
    date: String(input.date || ''),
    description,
    status: (String(input.status || 'upcoming') as CompetitionCmsStatus),
    prize: String(input.prize || ''),
    miniBannerImageUrl: String(input.miniBannerImageUrl || ''),
    pageSections,
    createdAt: Number(input.createdAt || Date.now()),
    updatedAt: Number(input.updatedAt || Date.now()),
  }
}

export function getStaticCompetitionCmsItems(): CompetitionCmsItem[] {
  return staticCompetitions.map((item) =>
    normalizeCompetitionCmsItem(
      {
        ...item,
        slug: slugifyCompetitionName(item.name),
        miniBannerImageUrl: '',
        pageSections: defaultSections(item.name, item.description),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      item.id,
    ),
  )
}
