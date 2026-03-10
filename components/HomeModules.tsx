'use client'

import { useEffect, useState } from 'react'
import Stats from '@/components/Stats'
import PartnersSlider from '@/components/PartnersSlider'
import {
  defaultHomepageModulesSettings,
  HomepageModulesSettings,
  loadHomepageModulesSettings,
} from '@/lib/homepageModules'

export default function HomeModules() {
  const [settings, setSettings] = useState<HomepageModulesSettings>(defaultHomepageModulesSettings)

  useEffect(() => {
    const loadData = async () => {
      const next = await loadHomepageModulesSettings()
      setSettings(next)
    }

    void loadData()
  }, [])

  return (
    <>
      {settings.showStats && <Stats />}
      {settings.showPartners && <PartnersSlider partners={settings.partners} />}
    </>
  )
}
