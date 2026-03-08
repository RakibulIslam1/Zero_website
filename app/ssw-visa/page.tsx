'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Briefcase, Star, FileText } from 'lucide-react'

const industries = [
  'Nursing Care', 'Building Cleaning', 'Materials Processing Industry',
  'Industrial Machinery Industry', 'Electric / Electronics / Information Industry',
  'Construction Industry', 'Shipbuilding / Ship Machinery Industry',
  'Automobile Repair and Maintenance', 'Aviation Industry',
  'Accommodation Industry', 'Agriculture', 'Fishery / Aquaculture',
  'Food / Beverages Manufacturing Industry', 'Food Service Industry',
]

const requirements = [
  'Pass the SSW Skills Evaluation Test for the chosen industry',
  'Pass the Japanese Language Proficiency Test (N4 or above) or pass the Japan Foundation Test for Basic Japanese',
  'Have work experience in relevant field (some industries waive this for TITP graduates)',
  'Be 18 years of age or older',
  'Be in good health and have no criminal record',
]

export default function SSWVisaPage() {
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
            SSW Visa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-red-100 max-w-2xl mx-auto"
          >
            Specified Skilled Worker (SSW) Visa — Work in Japan in one of 14 designated industries.
          </motion.p>
        </div>
      </section>

      {/* What is SSW */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              What is <span className="text-accent">Specified Skilled Worker (SSW)?</span>
            </motion.h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Specified Skilled Worker (SSW) visa was introduced by Japan in 2019 to address labor
              shortages in specific industries. It allows foreign workers with certain skills and Japanese
              language ability to work legally in Japan.
            </p>
            <p className="text-gray-600 leading-relaxed">
              SSW Type 1 allows up to 5 years of work, while SSW Type 2 is open-ended and can lead to
              permanent residency. Our center helps you prepare for the required tests and assists with
              the visa application process.
            </p>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Eligible <span className="text-accent">Industries</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {industries.map((industry, index) => (
              <motion.div
                key={industry}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center"
              >
                <Briefcase size={18} className="text-accent mx-auto mb-2" />
                <p className="text-sm text-gray-700 font-medium">{industry}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Key <span className="text-accent">Requirements</span>
            </h2>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <ul className="space-y-4">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-accent text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Apply for SSW Visa with Our Help</h2>
          <p className="text-red-100 mb-8">We guide you through test preparation, document processing, and visa application.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent rounded-full font-bold hover:bg-yellow-50 transition-colors"
          >
            Get Started Now
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
