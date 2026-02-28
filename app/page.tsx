import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Stats from '@/components/Stats'
import CTA from '@/components/CTA'
import Image from 'next/image'

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="pb-10 pt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl overflow-hidden border border-[#e8cfc9] shadow-[0_10px_30px_rgba(201,94,94,0.18)]">
            <Image
              src="/images/fb_cover.png"
              alt="Zero Competitions cover"
              width={1600}
              height={840}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </section>
      <Services />
      <Stats />
      <CTA />
    </>
  )
}
