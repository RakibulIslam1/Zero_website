'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function Hero() {
  const { user } = useAuth()

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent pt-16">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Welcome to <span className="text-accent">Zero Competitions</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Zero limits, infinite opportunities
          </p>
          <div className="flex justify-center">
            <Link
              href={user ? '#services-section' : '/login'}
              className="inline-flex items-center gap-2 px-9 py-4 bg-accent text-white rounded-full font-semibold shadow-[0_10px_28px_rgba(201,94,94,0.35)] hover:scale-[1.03] hover:bg-accent/90 transition-all duration-200 text-lg"
            >
              <Sparkles size={20} />
              {user ? 'Explore Zero' : 'Sign Up Now'}
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full mx-auto flex items-start justify-center pt-2"
          >
            <div className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
