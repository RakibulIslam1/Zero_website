'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CTA() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            Join our mission and take part in real opportunities with Zero Competitions.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
            <Link
              href="/join-us"
              className="px-4 sm:px-8 py-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-colors duration-200 text-sm sm:text-lg"
            >
              Join Us
            </Link>
            <Link
              href="/competitions"
              className="px-4 sm:px-8 py-4 bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:border-accent hover:text-accent transition-colors duration-200 text-sm sm:text-lg"
            >
              View Competitions
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
