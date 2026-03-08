'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Phone, ArrowRight } from 'lucide-react'

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
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Start Your Journey to Japan Today
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Contact us now and let our expert counselors guide you every step of the way —
            from language training to your student visa approval.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-colors duration-200 text-lg"
            >
              Contact Us Now
              <ArrowRight size={20} />
            </Link>
            <a
              href="tel:01601687773"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-accent text-accent rounded-full font-semibold hover:bg-accent hover:text-white transition-colors duration-200 text-lg"
            >
              <Phone size={20} />
              Call: 01601687773
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
