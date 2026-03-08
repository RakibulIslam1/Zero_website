import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BackgroundElements from '@/components/BackgroundElements'
import { AuthProvider } from '@/components/AuthProvider'
import { NotificationProvider } from '@/components/NotificationProvider'
import ForceLightTheme from '@/components/ForceLightTheme'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Samurai Japanese Language Training Center',
  description: 'One of the best Japanese language learning centers & student visa consultancy firms in Bangladesh.',
  colorScheme: 'light',
  icons: {
    icon: '/images/favicon.png?v=20250305',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body className={`${poppins.className} font-sans bg-[#FDF7F7] text-primary transition-colors duration-300 overflow-x-hidden`}>
        <AuthProvider>
          <NotificationProvider>
            <ForceLightTheme />
            <BackgroundElements />

            <div className="relative z-10">
              <Navbar />
              <main>{children}</main>
              <Footer />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
