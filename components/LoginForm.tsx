'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

export default function LoginForm() {
  const router = useRouter()
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', remember: false })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        await signUpWithEmail(form.fullName.trim(), form.email.trim(), form.password)
        router.push('/profile')
        return
      }

      await signInWithEmail(form.email.trim(), form.password)
      router.push('/profile')
    } catch (error) {
      setErrorMessage('Authentication failed. Please check your credentials and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="text-4xl font-bold text-accent tracking-widest">
          ZERO COMPETITIONS
        </Link>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#f8e2dd] mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`w-1/2 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'signin' ? 'bg-white text-gray-900' : 'text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`w-1/2 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'signup' ? 'bg-white text-gray-900' : 'text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">Use your email and password to sign in or create a new account.</p>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                placeholder="Your full name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <Link href="#" className="text-sm text-accent hover:text-accent/80 font-medium">
              Forgot Password?
            </Link>
          </div>

          {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-colors duration-200 disabled:opacity-70"
          >
            {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-accent font-medium hover:text-accent/80"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
