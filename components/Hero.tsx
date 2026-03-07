'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function Hero() {
  const { user } = useAuth()

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent pt-16">
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
            Zero Limits, Infinite Opportunities
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

      </div>
    </section>
  )
}
