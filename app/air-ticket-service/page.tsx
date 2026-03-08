'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Plane, Clock, DollarSign, Shield, Phone } from 'lucide-react'

const features = [
  {
    icon: DollarSign,
    title: 'Best Price Guarantee',
    description: 'We search and compare fares from all major airlines to get you the best possible price for your route.',
  },
  {
    icon: Plane,
    title: 'All Routes Available',
    description: 'Dhaka to Tokyo, Osaka, Nagoya, and all other Japanese cities. Also Malaysia and other destinations.',
  },
  {
    icon: Clock,
    title: 'Quick Booking',
    description: 'Fast and hassle-free ticket booking with immediate confirmation via email and SMS.',
  },
  {
    icon: Shield,
    title: 'Trusted Service',
    description: 'Hundreds of satisfied students and families have traveled with tickets booked through our center.',
  },
]

const destinations = [
  { from: 'Dhaka (DAC)', to: 'Tokyo (NRT/HND)', flag: '🇯🇵' },
  { from: 'Dhaka (DAC)', to: 'Osaka (KIX)', flag: '🇯🇵' },
  { from: 'Dhaka (DAC)', to: 'Nagoya (NGO)', flag: '🇯🇵' },
  { from: 'Dhaka (DAC)', to: 'Sapporo (CTS)', flag: '🇯🇵' },
  { from: 'Dhaka (DAC)', to: 'Kuala Lumpur (KUL)', flag: '🇲🇾' },
  { from: 'Dhaka (DAC)', to: 'Singapore (SIN)', flag: '🇸🇬' },
]

export default function AirTicketServicePage() {
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
            Air Ticket Service
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-red-100 max-w-2xl mx-auto"
          >
            Affordable and reliable air ticket booking service for students traveling to Japan, Malaysia, and beyond.
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Why Book With <span className="text-accent">Us?</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={22} className="text-accent" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular <span className="text-accent">Routes</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {destinations.map((dest, index) => (
              <motion.div
                key={dest.to}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <div className="text-3xl">{dest.flag}</div>
                <div>
                  <p className="text-xs text-gray-500">{dest.from}</p>
                  <div className="flex items-center gap-2 my-1">
                    <div className="h-px w-8 bg-accent/40" />
                    <Plane size={14} className="text-accent" />
                    <div className="h-px w-8 bg-accent/40" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{dest.to}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-transparent text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Book Your Ticket Today</h2>
          <p className="text-gray-600 mb-8">Contact us via phone or message to get the best fares and book your seat.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold hover:bg-accent-dark transition-colors"
            >
              Contact Us
              <ArrowRight size={18} />
            </Link>
            <a
              href="tel:01601687773"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-accent text-accent rounded-full font-bold hover:bg-accent hover:text-white transition-colors"
            >
              <Phone size={18} />
              Call Now
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
