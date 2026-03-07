'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { defaultSiteFeatureBannerSettings, loadSiteFeatureBannerSettings, SiteFeatureBannerSettings } from '@/lib/siteFeatureBanner'

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

export default function FeatureBanner() {
  const [settings, setSettings] = useState<SiteFeatureBannerSettings>(defaultSiteFeatureBannerSettings)

  useEffect(() => {
    const loadSettings = async () => {
      const loadedSettings = await loadSiteFeatureBannerSettings()
      setSettings(loadedSettings)
    }

    void loadSettings()
  }, [])

  const banner = (
    <div className="rounded-3xl overflow-hidden border border-[#e8cfc9] shadow-[0_10px_30px_rgba(201,94,94,0.18)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={settings.imageDataUrl || defaultSiteFeatureBannerSettings.imageDataUrl}
        alt="Zero Competitions feature banner"
        className="w-full h-auto object-cover"
      />
    </div>
  )

  return (
    <section className="pb-10 pt-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {settings.linkUrl ? (
          isExternalUrl(settings.linkUrl) ? (
            <a href={settings.linkUrl} target="_blank" rel="noreferrer" className="block">
              {banner}
            </a>
          ) : (
            <Link href={settings.linkUrl} className="block">
              {banner}
            </Link>
          )
        ) : (
          banner
        )}
      </div>
    </section>
  )
}
