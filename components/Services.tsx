'use client'

import { motion } from 'framer-motion'
import { BookOpen, FileCheck, Briefcase, Building2, Palette, Monitor } from 'lucide-react'

const services = [
  {
    icon: BookOpen,
    title: 'Japanese Language Training',
    description: 'Comprehensive Japanese language courses from beginner (N5) to advanced (N1) levels, preparing students for JLPT and NAT-TEST examinations.',
  },
  {
    icon: FileCheck,
    title: 'Student Visa A to Z Support',
    description: 'Complete assistance with Japan student visa applications, from document preparation to embassy submission and follow-up.',
  },
  {
    icon: Briefcase,
    title: 'TITP, SSW & Engineer Visa',
    description: 'Technical Intern Training Program (TITP), Specified Skilled Worker (SSW), and Engineer/Humanities/International Service Visa processing.',
  },
  {
    icon: Building2,
    title: 'Business Visa & Investment',
    description: 'Setup company and invest in Japan with visa support. Full guidance on business immigration pathways.',
  },
  {
    icon: Palette,
    title: 'Design Solutions',
    description: 'Professional architecture and interior design services for clients planning to establish or renovate in Japan.',
  },
  {
    icon: Monitor,
    title: 'IT Solutions',
    description: 'System security, web development, software, and hardware solutions to support your digital presence.',
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
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Our <span className="text-accent">Services</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            From language training to visa processing, we provide everything you need for your journey to Japan.
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
              className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:border-accent/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <service.icon size={24} className="text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
