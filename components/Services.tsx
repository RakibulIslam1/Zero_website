'use client'

import { motion } from 'framer-motion'
import { Code, Globe, Zap, Shield, TrendingUp, Users } from 'lucide-react'

const services = [
  {
    icon: Code,
    title: 'Software Development',
    description: 'Custom software solutions built with cutting-edge technologies to meet your unique business needs.',
  },
  {
    icon: Globe,
    title: 'Web Applications',
    description: 'Scalable, performant web applications designed for the modern digital landscape.',
  },
  {
    icon: Zap,
    title: 'Performance Optimization',
    description: 'We optimize your systems for maximum efficiency, speed, and reliability.',
  },
  {
    icon: Shield,
    title: 'Cybersecurity',
    description: 'Robust security solutions that protect your data and digital assets around the clock.',
  },
  {
    icon: TrendingUp,
    title: 'Digital Strategy',
    description: 'Strategic consulting to help you navigate digital transformation and growth.',
  },
  {
    icon: Users,
    title: 'Team Augmentation',
    description: 'Expert professionals who seamlessly integrate with your team to accelerate delivery.',
  },
]

export default function Services() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
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
            We deliver comprehensive technology services that drive innovation and business growth.
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
