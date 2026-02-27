'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import CompetitionCard from '@/components/CompetitionCard'
import { Trophy } from 'lucide-react'

const competitions = [
  {
    id: 1,
    name: 'ZERO Hackathon 2025',
    date: 'March 15–17, 2025',
    description: 'A 48-hour coding marathon where teams build innovative solutions to real-world problems using the latest technologies.',
    status: 'upcoming' as const,
    prize: 'Prize: $10,000',
  },
  {
    id: 2,
    name: 'AI Innovation Challenge',
    date: 'April 5, 2025',
    description: 'Design and build AI-powered applications that make everyday life easier and more efficient.',
    status: 'upcoming' as const,
    prize: 'Prize: $5,000',
  },
  {
    id: 3,
    name: 'Web Design Championship',
    date: 'February 20–22, 2025',
    description: 'Showcase your design skills in this intensive web design competition judged by industry experts.',
    status: 'ongoing' as const,
    prize: 'Prize: $3,000',
  },
  {
    id: 4,
    name: 'Open Source Sprint',
    date: 'May 1–7, 2025',
    description: 'Contribute to open source projects and earn recognition from the global developer community.',
    status: 'upcoming' as const,
    prize: 'Prize: $2,000',
  },
  {
    id: 5,
    name: 'ZERO Code Cup 2024',
    date: 'November 10–12, 2024',
    description: 'Our annual flagship coding competition featuring challenges across algorithms, data structures, and system design.',
    status: 'completed' as const,
    prize: 'Prize: $8,000',
  },
  {
    id: 6,
    name: 'Mobile App Showdown 2024',
    date: 'October 5, 2024',
    description: 'Participants built cross-platform mobile apps in 24 hours, judged on creativity, UX, and technical complexity.',
    status: 'completed' as const,
    prize: 'Prize: $4,000',
  },
]

type FilterType = 'all' | 'upcoming' | 'ongoing' | 'completed'

export default function CompetitionsPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? competitions : competitions.filter((c) => c.status === filter)

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
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
      <section className="py-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40">
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
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
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
