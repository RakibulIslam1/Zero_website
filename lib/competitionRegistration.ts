import { JoinUsField, defaultJoinUsSettings } from '@/lib/joinUs'

export type CompetitionRegistrationSettings = {
  competitionId: number
  headerText: string
  subheaderText: string
  fields: JoinUsField[]
}

export type CompetitionRegistrationApplication = {
  id: string
  competitionId: number
  competitionName: string
  competitionDate: string
  userId: string
  fullName: string
  email: string
  phone: string
  answers: Record<string, unknown>
  createdAt: number
}

export function createDefaultCompetitionRegistrationSettings(competitionId: number): CompetitionRegistrationSettings {
  return {
    competitionId,
    headerText: 'Competition Registration Form',
    subheaderText: 'Complete the form below to register for this competition.',
    fields: [
      {
        id: 'team_name',
        label: 'Team / Participant Name',
        type: 'text',
        required: true,
        options: [],
      },
      {
        id: 'institute_name',
        label: 'School / College / Institute',
        type: 'text',
        required: true,
        options: [],
      },
      {
        id: 'emergency_contact',
        label: 'Emergency Contact Number',
        type: 'phone',
        required: true,
        options: [],
      },
      {
        id: 'note',
        label: 'Additional Note',
        type: 'textarea',
        required: false,
        options: [],
      },
      ...defaultJoinUsSettings.fields.filter((field) => field.id !== 'position' && field.id !== 'experience'),
    ],
  }
}

export function normalizeCompetitionRegistrationSettings(
  competitionId: number,
  input: Record<string, unknown> | undefined,
): CompetitionRegistrationSettings {
  const fallback = createDefaultCompetitionRegistrationSettings(competitionId)
  const fieldsRaw = Array.isArray(input?.fields) ? input?.fields : fallback.fields

  const fields = fieldsRaw
    .map((entry, index) => {
      const field = entry as Record<string, unknown>
      const id = String(field.id || `field_${index + 1}`).trim()
      return {
        id: id || `field_${index + 1}`,
        label: String(field.label || `Field ${index + 1}`),
        type: (String(field.type || 'text') as JoinUsField['type']),
        required: Boolean(field.required),
        options: Array.isArray(field.options)
          ? field.options.map((item) => String(item || '').trim()).filter(Boolean)
          : [],
      }
    })
    .filter((field) => field.id)

  return {
    competitionId,
    headerText: String(input?.headerText || fallback.headerText),
    subheaderText: String(input?.subheaderText || fallback.subheaderText),
    fields,
  }
}
