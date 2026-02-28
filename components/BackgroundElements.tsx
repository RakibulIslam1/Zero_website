'use client'

import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'

const elements = [
  { src: '/images/bgelement-1.png', width: 260, height: 260, className: 'left-[7%] top-[9%] w-[110px] md:w-[180px]' },
  { src: '/images/bgelement-2.png', width: 240, height: 240, className: 'left-[58%] top-[6%] w-[120px] md:w-[185px]' },
  { src: '/images/bgelement-1.png', width: 240, height: 240, className: 'right-[11%] top-[34%] w-[100px] md:w-[165px]' },
  { src: '/images/bgelement-2.png', width: 250, height: 250, className: 'left-[16%] top-[52%] w-[115px] md:w-[175px]' },
  { src: '/images/bgelement-1.png', width: 245, height: 245, className: 'left-[44%] bottom-[9%] w-[105px] md:w-[170px]' },
  { src: '/images/bgelement-2.png', width: 265, height: 265, className: 'right-[6%] bottom-[6%] w-[125px] md:w-[190px]' },
]

export default function BackgroundElements() {
  const { scrollYProgress } = useScroll()
  const scrollY = useTransform(scrollYProgress, [0, 1], [-34, 34])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {elements.map((element, index) => (
        <motion.div
          key={`${element.src}-${index}`}
          className={`absolute ${element.className}`}
          style={{ y: scrollY }}
          animate={{
            x: [0, 10, -7, 0],
            rotate: [0, 2.8, -2.2, 0],
          }}
          transition={{
            duration: 4.6 + index * 0.7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.15,
          }}
        >
          <Image
            src={element.src}
            alt=""
            width={element.width}
            height={element.height}
            className="w-full h-auto opacity-50 blur-[2px]"
            priority={index < 2}
          />
        </motion.div>
      ))}
    </div>
  )
}
