import React from 'react'
import '../styles/design.css'
import ThemeProvider from '../components/ThemeProvider'
import AppShell from '../components/AppShell'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  title: 'Founder Falcon',
  description: 'AI startup operating system',
  icons: {
    icon: '/images/favicon.png'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
