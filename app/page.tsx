import Hero from '@/components/Hero'
import Services from '@/components/Services'
import CTA from '@/components/CTA'
import FeatureBanner from '@/components/FeatureBanner'
import HomeModules from '@/components/HomeModules'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureBanner />
      <Services />
      <HomeModules />
      <CTA />
    </>
  )
}
