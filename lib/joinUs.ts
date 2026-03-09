export type JoinUsFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'file'

export type JoinUsFileAnswer = {
  fileName: string
  mimeType: string
  size: number
  dataUrl: string
}

export type JoinUsAnswerValue = string | JoinUsFileAnswer

export function isJoinUsFileAnswer(value: unknown): value is JoinUsFileAnswer {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.fileName === 'string' &&
    typeof entry.mimeType === 'string' &&
    typeof entry.size === 'number' &&
    typeof entry.dataUrl === 'string'
  )
}

export type JoinUsField = {
  id: string
  label: string
  type: JoinUsFieldType
  required: boolean
  options: string[]
}

export type JoinUsSettings = {
  headerText: string
  subheaderText: string
  headerImageDataUrl: string
  fields: JoinUsField[]
}

export const defaultJoinUsSettings: JoinUsSettings = {
  headerText: 'Join Our Team',
  subheaderText: 'Apply to become part of Zero Competitions.',
  headerImageDataUrl: '/images/fb_cover.png',
  fields: [
    {
      id: 'position',
      label: 'Preferred Role',
      type: 'select',
      required: true,
      options: ['Mentor', 'Coordinator', 'Volunteer'],
    },
    {
      id: 'experience',
      label: 'Experience',
      type: 'textarea',
      required: true,
      options: [],
    },
  ],
}

export function normalizeJoinUsSettings(data: Record<string, unknown> | undefined): JoinUsSettings {
  const fieldsRaw = Array.isArray(data?.fields) ? data?.fields : defaultJoinUsSettings.fields

  const fields = fieldsRaw
    .map((entry, index) => {
      const item = entry as Record<string, unknown>
      const id = String(item.id || `field_${index + 1}`).trim()
      return {
        id: id || `field_${index + 1}`,
        label: String(item.label || `Field ${index + 1}`),
        type: (String(item.type || 'text') as JoinUsFieldType),
        required: Boolean(item.required),
        options: Array.isArray(item.options)
          ? item.options.map((option) => String(option || '').trim()).filter(Boolean)
          : [],
      }
    })
    .filter((field) => field.id)

  return {
    headerText: String(data?.headerText || defaultJoinUsSettings.headerText),
    subheaderText: String(data?.subheaderText || defaultJoinUsSettings.subheaderText),
    headerImageDataUrl: String(data?.headerImageDataUrl || defaultJoinUsSettings.headerImageDataUrl),
    fields,
  }
}
