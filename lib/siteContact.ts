export type SiteContactSettings = {
  address: string
  phones: string[]
  email: string
  officeHours: string
}

export const defaultSiteContactSettings: SiteContactSettings = {
  address: 'House-298, Shadinota Sharoni, Road, Jamtula Mur, Uttar Badda, Dhaka-1212',
  phones: ['01601687773', '01967016700'],
  email: 'miahsuzan818@gmail.com',
  officeHours: 'Sat–Thu: 9 AM – 6 PM',
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
