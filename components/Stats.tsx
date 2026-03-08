'use client'

import { motion } from 'framer-motion'
import { Zap, TrendingUp, Plane, DollarSign } from 'lucide-react'

const reasons = [
  {
    icon: TrendingUp,
    title: '3rd Largest Economy',
    description: 'Japan has the world\'s 3rd largest economy, offering immense opportunities for career growth and professional development.',
  },
  {
    icon: Zap,
    title: 'Hi-Tech Country',
    description: 'Japan is at the forefront of technology and innovation, providing an ideal environment for learning cutting-edge skills.',
  },
  {
    icon: DollarSign,
    title: 'High Part-Time Salary',
    description: 'Students can work part-time and earn competitive wages, helping cover living expenses while studying in Japan.',
  },
  {
    icon: Plane,
    title: 'Visa-Free Access',
    description: 'A Japanese student visa opens doors to visa-free or visa-on-arrival access to many countries worldwide.',
  },
]

export default function Stats() {
  return (
    <section className="py-24 bg-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Why Study in Japan?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-red-100 text-lg max-w-2xl mx-auto"
          >
            Discover why thousands of Bangladeshi students choose Japan for their higher education.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white text-center hover:bg-white/20 transition-colors"
            >
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <reason.icon size={28} className="text-yellow-300" />
              </div>
              <h3 className="text-lg font-bold mb-2">{reason.title}</h3>
              <p className="text-red-100 text-sm leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
