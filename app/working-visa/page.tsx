'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Briefcase } from 'lucide-react'

const visaTypes = [
  {
    title: 'Engineer / Humanities / International Services',
    description: 'For professionals in IT, engineering, finance, law, teaching, and international business. Requires a relevant university degree or 10 years of work experience.',
    requirements: ['University degree in relevant field OR 10+ years work experience', 'Job offer from Japanese company', 'Japanese or English language skills'],
  },
  {
    title: 'Technical Intern Training (TITP)',
    description: 'Allows workers to gain practical skills and experience in Japan for up to 5 years across various industries.',
    requirements: ['18 years or older', 'Pass JLPT N4 or equivalent test', 'No criminal record', 'Good health'],
  },
  {
    title: 'Business Manager Visa',
    description: 'For entrepreneurs and investors who want to start or invest in a business in Japan.',
    requirements: ['Business office in Japan', 'Minimum investment of ¥5 million OR 2 full-time employees', 'Business plan submission'],
  },
]

export default function WorkingVisaPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-20 bg-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl font-bold mb-4"
          >
            Working Visa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-red-100 max-w-2xl mx-auto"
          >
            TITP, SSW & Engineer / Humanities / International Service Visa — Work legally in Japan.
          </motion.p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Build Your Career <span className="text-accent">in Japan</span>
            </motion.h2>
            <p className="text-gray-600 leading-relaxed">
              Japan offers numerous work visa categories to suit different professional backgrounds and goals.
              Our experienced team will help you identify the right visa category and guide you through the
              entire application process.
            </p>
          </div>
        </div>
      </section>

      {/* Visa Types */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Work Visa <span className="text-accent">Categories</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {visaTypes.map((visa, index) => (
              <motion.div
                key={visa.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <Briefcase size={28} className="text-accent mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-3">{visa.title}</h3>
                <p className="text-gray-600 text-sm mb-5">{visa.description}</p>
                <ul className="space-y-2">
                  {visa.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-accent text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Work in Japan?</h2>
          <p className="text-red-100 mb-8">Our team will guide you to the right visa category and handle all paperwork.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent rounded-full font-bold hover:bg-yellow-50 transition-colors"
          >
            Contact Us Today
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
