import React from 'react'
import { Inter, Manrope } from 'next/font/google'
import { APP_NAME, APP_TAGLINE } from '../lib/brand'
import '../styles/design.css'
import ThemeProvider from '../components/ThemeProvider'
import AppShell from '../components/AppShell'
import { AuthProvider } from '../context/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800']
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['600', '700', '800']
})

export const metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  icons: {
    icon: '/images/favicon.png'
  },
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    type: 'website',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a href="#main-content" className="ff-skip-link">Skip to content</a>
        <AuthProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
