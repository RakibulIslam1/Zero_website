export type SiteContactSettings = {
  address: string
  phones: string[]
  email: string
  officeHours: string
}

export const defaultSiteContactSettings: SiteContactSettings = {
  address: 'Address not updated yet',
  phones: ['01754496926', '01750964611'],
  email: 'info.zerocomps@gmail.com',
  officeHours: 'Closed',
}

export async function loadSiteContactSettings(): Promise<SiteContactSettings> {
  try {
    const response = await fetch('/api/site-contact', { method: 'GET' })
    if (!response.ok) {
      return defaultSiteContactSettings
    }

    const payload = (await response.json()) as { settings?: SiteContactSettings }
    return payload.settings ?? defaultSiteContactSettings
  } catch {
    return defaultSiteContactSettings
  }
}
