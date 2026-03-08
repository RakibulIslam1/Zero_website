'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, ArrowRight, FileText, GraduationCap, Plane, BookOpen } from 'lucide-react'

const steps = [
  {
    icon: BookOpen,
    title: 'Japanese Language Training',
    description: 'Complete N5 or higher Japanese language course at our center. Language proficiency is key to visa success.',
  },
  {
    icon: FileText,
    title: 'Document Preparation',
    description: 'We assist with all required documents: academic certificates, bank statements, sponsor letters, and application forms.',
  },
  {
    icon: GraduationCap,
    title: 'School Admission',
    description: 'We connect you with our partner Japanese language schools and universities and handle your admission process.',
  },
  {
    icon: Plane,
    title: 'Visa Application & Approval',
    description: 'Our visa experts submit your application to the Bangladesh Embassy of Japan and follow up until approval.',
  },
]

const eligibility = [
  'HSC / Alim / Diploma or equivalent qualification',
  'Honours or Masters degree holders',
  'Maximum 5 years gap since last study',
  'Clean financial background with bank solvency',
  'No criminal record',
  'N5 or higher Japanese language proficiency (preferred)',
]

export default function JapanStudentVisaPage() {
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
            Japan Student Visa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-red-100 max-w-2xl mx-auto"
          >
            Your complete guide to obtaining a Japan student visa — from language training to landing in Japan.
          </motion.p>
        </div>
      </section>

      {/* What is Japan Student Visa */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Study in Japan with a <span className="text-accent">Student Visa</span>
            </motion.h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Japan offers world-class education in a technology-rich environment. A Japanese student visa
              (College Student Visa) allows you to enroll in language schools, colleges, vocational schools,
              and universities in Japan.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Students can also work part-time (up to 28 hours/week) to support their living expenses
              while gaining valuable international experience.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            How We <span className="text-accent">Help You</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon size={26} className="text-accent" />
                </div>
                <div className="text-xs font-bold text-accent mb-2">STEP {index + 1}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Eligibility <span className="text-accent">Requirements</span>
            </h2>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <ul className="space-y-4">
                {eligibility.map((item) => (
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
          <h2 className="text-3xl font-bold mb-4">Ready to Apply for Japan Student Visa?</h2>
          <p className="text-red-100 mb-8">Contact our experts today for a free consultation.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent rounded-full font-bold hover:bg-yellow-50 transition-colors"
          >
            Get Free Consultation
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
