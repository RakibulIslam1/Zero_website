import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BackgroundElements from '@/components/BackgroundElements'
import { AuthProvider } from '@/components/AuthProvider'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Zero Competitions',
  description: 'ZERO is a modern, innovative company delivering excellence in every project.',
  icons: {
    icon: '/images/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} font-sans bg-[#FAEAE6] text-primary transition-colors duration-300 overflow-x-hidden`}>
        <AuthProvider>
          <BackgroundElements />

          <div className="relative z-10">
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
