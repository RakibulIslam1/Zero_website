'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import CompetitionCard from '@/components/CompetitionCard'
import { Trophy } from 'lucide-react'
import { competitions } from '@/lib/competitions'

type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed'

export default function CompetitionsPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? competitions : competitions.filter((c) => c.status === filter)

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mb-6"
          >
            <Trophy size={32} className="text-accent" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Competitions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Compete, collaborate, and conquer. Join ZERO's exciting competitions and win amazing prizes.
          </motion.p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 bg-[#FAEAE6]/95 border-b border-gray-200 sticky top-24 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 overflow-x-auto">
            {(['all', 'upcoming', 'ongoing', 'completed'] as FilterType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors duration-200 ${
                  filter === tab
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Grid */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((competition, index) => (
              <motion.div
                key={competition.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CompetitionCard
                  id={competition.id}
                  name={competition.name}
                  date={competition.date}
                  description={competition.description}
                  status={competition.status}
                  prize={competition.prize}
                />
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              No competitions found for this filter.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
