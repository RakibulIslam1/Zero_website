'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Zero' },
  { href: '/competitions', label: 'Competitions' },
  { href: '/contact', label: 'Contact Us' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut, isAdmin } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAEAE6]/95 backdrop-blur-md border-b border-[#e8cfc9]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Zero Competitions home">
            <Image
              src="/images/Zero-Competitions_logo.png"
              alt="Zero Competitions"
              width={220}
              height={60}
              className="h-12 w-auto md:h-[3.2rem]"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg font-semibold text-gray-700 hover:text-accent transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link href="/admin" className="text-lg font-semibold text-gray-700 hover:text-accent transition-colors duration-200">
                Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#f0d9d4] bg-[#f6dfda] flex items-center justify-center"
                  aria-label="Open profile"
                >
                  {user.avatarDataUrl ? (
                    <Image src={user.avatarDataUrl} alt={user.fullName} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-accent font-semibold">{user.fullName.slice(0, 1).toUpperCase()}</span>
                  )}
                </Link>

                <button
                  onClick={() => signOut()}
                  className="w-10 h-10 rounded-full border border-[#e8cfc9] bg-[#FAEAE6] hover:bg-[#f5ddd8] flex items-center justify-center"
                  aria-label="Sign out"
                >
                  <LogOut size={16} className="text-gray-700" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full text-gray-700 hover:bg-[#f3d7d2] transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#e8cfc9] bg-[#FAEAE6]"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-base font-semibold text-gray-700 hover:text-accent py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="block text-base font-semibold text-gray-700 hover:text-accent py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              )}

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block text-base font-semibold text-gray-700 hover:text-accent py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setIsOpen(false)
                    }}
                    className="block w-full text-left text-base font-semibold text-gray-700 hover:text-accent py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block text-base font-semibold text-gray-700 hover:text-accent py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
