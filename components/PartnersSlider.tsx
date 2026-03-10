'use client'

import { useEffect, useMemo, useState } from 'react'
import { PartnerLogo } from '@/lib/homepageModules'

type PartnersSliderProps = {
  partners: PartnerLogo[]
}

function wrapIndex(index: number, length: number) {
  if (length === 0) return 0
  return ((index % length) + length) % length
}

export default function PartnersSlider({ partners }: PartnersSliderProps) {
  const [centerIndex, setCenterIndex] = useState(0)

  useEffect(() => {
    if (partners.length <= 1) return

    const timer = setInterval(() => {
      setCenterIndex((current) => wrapIndex(current + 1, partners.length))
    }, 1800)

    return () => clearInterval(timer)
  }, [partners.length])

  const visible = useMemo(() => {
    if (partners.length === 0) return []
    const offsets = partners.length < 5 ? [-1, 0, 1] : [-2, -1, 0, 1, 2]
    return offsets.map((offset) => {
      const index = wrapIndex(centerIndex + offset, partners.length)
      return {
        offset,
        partner: partners[index],
      }
    })
  }, [partners, centerIndex])

  if (partners.length === 0) return null

  return (
    <section className="py-20 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">Our Partners</h2>

        <div className="flex items-center justify-center gap-3 sm:gap-5 overflow-hidden">
          {visible.map(({ offset, partner }) => {
            const isCenter = offset === 0
            const sideClass =
              Math.abs(offset) === 2
                ? 'scale-[0.78] opacity-70'
                : Math.abs(offset) === 1
                  ? 'scale-[0.9] opacity-85'
                  : 'scale-100 opacity-100'

            return (
              <div
                key={`${partner.id}-${offset}`}
                className={`group transition-all duration-500 ease-out ${sideClass} ${isCenter ? 'z-20' : 'z-10'}`}
              >
                <div
                  className={`rounded-2xl border border-[#ead3cd] bg-white/95 flex items-center justify-center transition-all duration-500 px-4 py-4 sm:px-6 sm:py-6 ${
                    isCenter
                      ? 'w-36 h-24 sm:w-44 sm:h-28 shadow-md'
                      : 'w-28 h-20 sm:w-36 sm:h-24'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.imageDataUrl}
                    alt={partner.name}
                    className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                      isCenter
                        ? 'grayscale-0'
                        : 'grayscale group-hover:grayscale-0 group-hover:scale-105'
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
