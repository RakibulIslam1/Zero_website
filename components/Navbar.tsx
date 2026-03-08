'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/japan-student-visa', label: 'Japan Student Visa' },
  { href: '/ssw-visa', label: 'SSW Visa' },
  { href: '/working-visa', label: 'Working Visa' },
  { href: '/malaysia-student-visa', label: 'Malaysia Student Visa' },
  { href: '/air-ticket-service', label: 'Air Ticket Service' },
  { href: '/contact', label: 'Contact Us' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut, isAdmin, loading } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#7A1020]/95 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2" aria-label="Samurai Japanese Language Training Center home">
            <span className="text-white font-bold text-lg leading-tight hidden sm:block">
              Samurai<br />
              <span className="text-yellow-300 text-sm font-semibold">Japanese Language Training</span>
            </span>
            <span className="text-white font-bold text-base leading-tight sm:hidden">
              Samurai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/90 hover:text-yellow-300 transition-colors duration-200 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link href="/admin" className="text-sm font-medium text-white/90 hover:text-yellow-300 transition-colors duration-200">
                Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-yellow-400 text-gray-900 text-sm font-semibold hover:bg-yellow-300 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden gap-2">
            {!loading && !user && (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-full bg-yellow-400 text-gray-900 text-xs font-semibold hover:bg-yellow-300 transition-colors"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="lg:hidden border-t border-white/20 bg-[#7A1020] shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:text-yellow-300 hover:bg-white/10 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:text-yellow-300 hover:bg-white/10 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              )}

              {user && (
                <button
                  onClick={() => {
                    signOut()
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:text-yellow-300 hover:bg-white/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
