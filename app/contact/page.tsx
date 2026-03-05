'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import ContactForm from '@/components/ContactForm'

type ContactSettings = {
  address: string
  phones: string[]
  email: string
  officeHours: string
}

const defaultSettings: ContactSettings = {
  address: 'Address not updated yet',
  phones: ['01754496926', '01750964611'],
  email: 'info.zerocomps@gmail.com',
  officeHours: 'Closed',
}

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings)

  useEffect(() => {
    const loadContactSettings = async () => {
      try {
        const response = await fetch('/api/site-contact', { method: 'GET' })
        if (!response.ok) return

        const payload = (await response.json()) as { settings?: ContactSettings }
        if (!payload.settings) return
        setSettings(payload.settings)
      } catch {
        // Keep default values if fetch fails.
      }
    }

    void loadContactSettings()
  }, [])

  const contactInfo = useMemo(
    () => [
      { icon: MapPin, label: 'Address', values: [settings.address] },
      { icon: Phone, label: 'Phone', values: settings.phones },
      { icon: Mail, label: 'Email', values: [settings.email] },
      { icon: Clock, label: 'Office Hours', values: [settings.officeHours] },
    ],
    [settings],
  )

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Contact <span className="text-accent">Us</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Have a question or want to work together? We'd love to hear from you.
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Send us a Message</h2>
              <ContactForm />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Get in Touch</h2>
              <div className="space-y-6 mb-10">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <info.icon size={22} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{info.label}</p>
                      {info.values.map((value) => (
                        <p key={value} className="text-gray-900 dark:text-white font-medium">
                          {value}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map placeholder */}
              <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <div className="text-center text-gray-400 dark:text-gray-600">
                  <MapPin size={40} className="mx-auto mb-2" />
                  <p className="text-sm">Map placeholder</p>
                  <p className="text-xs">{settings.address}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
