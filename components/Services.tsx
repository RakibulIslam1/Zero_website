'use client'

import { motion } from 'framer-motion'
import { Globe2, Target, GraduationCap, ClipboardList, FlaskConical, HeartHandshake } from 'lucide-react'

const services = [
  {
    icon: Globe2,
    title: 'Global Partnerships',
    description: 'Securing the official pathways and international seats required for local talent to compete on the world\'s most prestigious stages.',
  },
  {
    icon: Target,
    title: 'National Qualifiers',
    description: 'Operating a merit-first scouting system that reaches every district to ensure equal opportunity for every brilliant mind in the country.',
  },
  {
    icon: GraduationCap,
    title: 'Elite Mentorships & Training',
    description: 'Refining raw intellect through high-intensity boot camps and masterclasses designed to meet the rigorous standards of global competition.',
  },
  {
    icon: ClipboardList,
    title: 'End-to-End Logistics',
    description: 'Managing every administrative hurdle—from registrations and visas to international travel—to keep the focus entirely on the competition.',
  },
  {
    icon: FlaskConical,
    title: 'Physical Research Lab',
    description: 'Providing the infrastructure for hands-on innovation where theoretical knowledge is transformed into tangible prototypes and solutions.',
  },
  {
    icon: HeartHandshake,
    title: 'Volunteering Experience',
    description: 'Cultivating a community-driven ecosystem where alumni and industry experts return to mentor and lift the next generation of leaders.',
  },
]

export default function Services() {
  return (
    <section id="services-section" className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            What We Do
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Everything we do is built around one mission — putting Bangladesh's brightest minds on the global stage.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-gray-700 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <service.icon size={24} className="text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
