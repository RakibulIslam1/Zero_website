'use client'

import { motion } from 'framer-motion'
import { GraduationCap, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const requirements = [
  {
    title: 'HSC / Alim / Diploma and Equivalent',
    description: 'Higher Secondary Certificate, Alim, Diploma or equivalent qualifications are accepted for Japan student visa applications.',
  },
  {
    title: 'Honours / Masters Degrees',
    description: 'Bachelor\'s Honours and Master\'s degree holders are eligible to apply for advanced academic programs in Japan.',
  },
  {
    title: 'Maximum 5 Years Gap in Studies',
    description: 'Applicants must not have a study gap of more than 5 years from their last academic qualification.',
  },
]

export default function EduRequirements() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Educational Qualification <span className="text-accent">Requirements</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Check if you meet the minimum requirements to apply for Japan student visa through our center.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {requirements.map((req, index) => (
            <motion.div
              key={req.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{req.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{req.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-accent/5 border border-accent/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-accent flex-shrink-0" />
            <p className="text-gray-700 font-medium">
              Not sure if you qualify? Get a <strong>free counseling session</strong> with our experts.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-colors whitespace-nowrap text-sm"
          >
            Book Free Consultation
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
