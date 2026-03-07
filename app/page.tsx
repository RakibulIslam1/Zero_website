import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Stats from '@/components/Stats'
import CTA from '@/components/CTA'
import FeatureBanner from '@/components/FeatureBanner'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureBanner />
      <Services />
      <Stats />
      <CTA />
    </>
  )
}
