import Link from 'next/link'
import { Github, Twitter, Linkedin, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-white tracking-widest mb-4">ZERO</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              ZERO is a forward-thinking company dedicated to innovation, excellence, and delivering
              transformative solutions that shape the future of technology.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" aria-label="GitHub" className="hover:text-accent transition-colors">
                <Github size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-accent transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-accent transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-accent transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About Zero' },
                { href: '/competitions', label: 'Competitions' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>123 Innovation Street</li>
              <li>Tech City, TC 10001</li>
              <li>info@zero.company</li>
              <li>+1 (555) 000-0000</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ZERO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
