'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, ArrowRight, GraduationCap, DollarSign, Globe2, Clock } from 'lucide-react'

const benefits = [
  {
    icon: DollarSign,
    title: 'Affordable Education',
    description: 'Malaysia offers world-class education at a fraction of the cost compared to Western countries.',
  },
  {
    icon: Globe2,
    title: 'English Medium',
    description: 'Most universities and colleges in Malaysia offer programs in English, making it accessible for Bangladeshi students.',
  },
  {
    icon: Clock,
    title: 'Faster Processing',
    description: 'Malaysia student visas are generally processed faster than many other countries.',
  },
  {
    icon: GraduationCap,
    title: 'Globally Recognized',
    description: 'Malaysian degrees are internationally recognized and open doors to global career opportunities.',
  },
]

const steps = [
  'Choose your preferred university or college program',
  'Receive an offer letter from the institution',
  'Apply for Malaysia Student Pass (eVISA Malaysia)',
  'Submit required documents through EMGS (Education Malaysia Global Services)',
  'Pay visa fees and await approval',
  'Travel to Malaysia and collect your Student Pass',
]

export default function MalaysiaStudentVisaPage() {
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
            Malaysia Student Visa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-red-100 max-w-2xl mx-auto"
          >
            Study in Malaysia — affordable, English-medium education with global recognition.
          </motion.p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Why Study in <span className="text-accent">Malaysia?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon size={22} className="text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Visa Application <span className="text-accent">Process</span>
            </h2>
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <motion.li
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-accent text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Plan Your Studies in Malaysia</h2>
          <p className="text-red-100 mb-8">Our counselors will help you choose the right institution and handle your visa application.</p>
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
