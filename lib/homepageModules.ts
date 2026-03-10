export type PartnerLogo = {
  id: string
  name: string
  imageDataUrl: string
}

export type HomepageModulesSettings = {
  showStats: boolean
  showPartners: boolean
  partners: PartnerLogo[]
}

export const defaultHomepageModulesSettings: HomepageModulesSettings = {
  showStats: false,
  showPartners: false,
  partners: [],
}

export function normalizeHomepageModulesSettings(data: Record<string, unknown> | undefined): HomepageModulesSettings {
  const partnersRaw = Array.isArray(data?.partners) ? data?.partners : []

  const partners = partnersRaw
    .map((entry, index) => {
      const item = entry as Record<string, unknown>
      return {
        id: String(item.id || `partner_${index + 1}`),
        name: String(item.name || `Partner ${index + 1}`),
        imageDataUrl: String(item.imageDataUrl || ''),
      }
    })
    .filter((entry) => entry.imageDataUrl)

  return {
    showStats: data?.showStats === true,
    showPartners: data?.showPartners === true,
    partners,
  }
}

export async function loadHomepageModulesSettings(): Promise<HomepageModulesSettings> {
  try {
    const response = await fetch('/api/homepage-modules', { method: 'GET' })
    if (!response.ok) {
      return defaultHomepageModulesSettings
    }

    const payload = (await response.json()) as { settings?: HomepageModulesSettings }
    return payload.settings ?? defaultHomepageModulesSettings
  } catch {
    return defaultHomepageModulesSettings
  }
}
