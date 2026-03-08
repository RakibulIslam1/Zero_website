'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const levels = [
  {
    title: 'Beginner Level',
    subtitle: 'N5 – N4',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-600',
    bullets: [
      'Hiragana, Katakana & basic Kanji',
      'Everyday conversational Japanese',
      'Basic grammar structures',
      'NAT-TEST & JLPT N5/N4 preparation',
    ],
    pricing: [
      { level: 'N5', price: '99,000 BDT' },
      { level: 'N4', price: '120,000 BDT' },
    ],
  },
  {
    title: 'Intermediate Level',
    subtitle: 'N3',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-600',
    bullets: [
      'Intermediate grammar & vocabulary',
      'Reading comprehension & writing',
      'Business Japanese introduction',
      'JLPT N3 examination preparation',
    ],
    pricing: [
      { level: 'N3', price: '150,000 BDT' },
    ],
  },
  {
    title: 'Advanced Level',
    subtitle: 'N2 – N1',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-600',
    bullets: [
      'Advanced grammar & complex Kanji',
      'Academic & professional Japanese',
      'University interview preparation',
      'JLPT N2/N1 examination preparation',
    ],
    pricing: [
      { level: 'N2', price: '180,000 BDT' },
      { level: 'N1', price: '200,000 BDT' },
    ],
  },
]

export default function CourseLevels() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Course <span className="text-accent">Levels</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Choose the course level that matches your current Japanese language ability.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {levels.map((level, index) => (
            <motion.div
              key={level.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`rounded-2xl border-2 overflow-hidden ${level.color}`}
            >
              <div className={`${level.headerColor} px-6 py-5 text-white`}>
                <h3 className="text-xl font-bold">{level.title}</h3>
                <p className="text-white/80 text-sm mt-1">{level.subtitle}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {level.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-gray-700 text-sm">
                      <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {level.pricing.map((p) => (
                    <div key={p.level} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">JLPT {p.level}</span>
                      <span className="text-sm font-bold text-accent">{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-colors duration-200"
          >
            Enroll Now
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
