'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, User, X, LogOut } from 'lucide-react'
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto rounded-full bg-[#FAEAE6]/86 backdrop-blur-xl border border-[#e8cfc9] shadow-[0_10px_36px_rgba(201,94,94,0.22)]">
        <div className="flex items-center justify-between h-20 px-5 sm:px-7 lg:px-10">
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
          <div className="hidden md:flex items-center space-x-8 relative">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-accent transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <button
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#f0d9d4] bg-[#f6dfda] flex items-center justify-center"
                  aria-label="Open profile menu"
                >
                  {user.avatarDataUrl ? (
                    <Image src={user.avatarDataUrl} alt={user.fullName} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-accent font-semibold">{user.fullName.slice(0, 1).toUpperCase()}</span>
                  )}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-16 w-52 rounded-2xl border border-[#e8cfc9] bg-[#FAEAE6] shadow-[0_10px_24px_rgba(201,94,94,0.18)] p-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-[#f5ddd8]"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        signOut()
                        setIsProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-[#f5ddd8]"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
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
            className="md:hidden mt-2 max-w-7xl mx-auto rounded-3xl bg-[#FAEAE6]/95 backdrop-blur-xl border border-[#e8cfc9] shadow-[0_10px_30px_rgba(201,94,94,0.16)]"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-medium text-gray-700 hover:text-accent py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block text-sm font-medium text-gray-700 hover:text-accent py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      signOut()
                      setIsOpen(false)
                    }}
                    className="block w-full text-left text-sm font-medium text-gray-700 hover:text-accent py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block text-sm font-medium text-gray-700 hover:text-accent py-2"
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
