export type SiteFeatureBannerSettings = {
  imageDataUrl: string
  linkUrl: string
}

export const defaultSiteFeatureBannerSettings: SiteFeatureBannerSettings = {
  imageDataUrl: '/images/fb_cover.png',
  linkUrl: '',
}

export async function loadSiteFeatureBannerSettings(): Promise<SiteFeatureBannerSettings> {
  try {
    const response = await fetch('/api/site-feature-banner', { method: 'GET' })
    if (!response.ok) {
      return defaultSiteFeatureBannerSettings
    }

    const payload = (await response.json()) as { settings?: SiteFeatureBannerSettings }
    return payload.settings ?? defaultSiteFeatureBannerSettings
  } catch {
    return defaultSiteFeatureBannerSettings
  }
}
