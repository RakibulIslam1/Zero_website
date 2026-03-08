'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import ContactForm from '@/components/ContactForm'

const offices = [
  {
    country: '🇧🇩 Bangladesh Office',
    address: 'House-298, Shadinota Sharoni, Road, Jamtula Mur, Uttar Badda, Dhaka-1212',
    phones: ['01601687773', '01967016700'],
    email: 'miahsuzan818@gmail.com',
    hours: 'Sat–Thu: 9 AM – 6 PM',
  },
  {
    country: '🇯🇵 Japan Office',
    address: 'Tokyo to Kita ku Akabane Nishi 4-35-5 Sakauekup101',
    phones: ['+81 70-9039-4475'],
    email: 'miahsuzan818@gmail.com',
    hours: 'Mon–Fri: 9 AM – 5 PM (JST)',
  },
]

export default function ContactPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-16 bg-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl font-bold mb-4"
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-red-100 max-w-2xl mx-auto"
          >
            Have a question about our programs or visa services? We&apos;d love to hear from you.
          </motion.p>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {offices.map((office, index) => (
              <motion.div
                key={office.country}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">{office.country}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-accent mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{office.address}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      {office.phones.map((phone) => (
                        <a
                          key={phone}
                          href={`tel:${phone.replace(/\s/g, '')}`}
                          className="block text-gray-700 hover:text-accent transition-colors"
                        >
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-accent flex-shrink-0" />
                    <a href={`mailto:${office.email}`} className="text-gray-700 hover:text-accent transition-colors">
                      {office.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-accent flex-shrink-0" />
                    <p className="text-gray-700">{office.hours}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-3xl font-bold text-gray-900 mb-8 text-center"
            >
              Send Us a Message
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
