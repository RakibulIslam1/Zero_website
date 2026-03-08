'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-white mb-2">Samurai</h3>
            <p className="text-yellow-400 text-sm font-semibold mb-4">Japanese Language Training Center</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Samurai Japanese Language Training center is one of the best Japanese language learning centers
              and student visa consultancy firms in Bangladesh. We offer comprehensive educational services
              to Bangladeshi students who intend to study in Japan and other developed countries.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About Us' },
                { href: '/japan-student-visa', label: 'Japan Student Visa' },
                { href: '/ssw-visa', label: 'SSW Visa' },
                { href: '/working-visa', label: 'Working Visa' },
                { href: '/malaysia-student-visa', label: 'Malaysia Student Visa' },
                { href: '/air-ticket-service', label: 'Air Ticket Service' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-yellow-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>House-298, Shadinota Sharoni, Jamtula Mur, Uttar Badda, Dhaka-1212</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-yellow-400 flex-shrink-0" />
                <span>01601687773, 01967016700</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-yellow-400 flex-shrink-0" />
                <span>miahsuzan818@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          <p>© 2023 Samurai Japanese Language Training Center. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
