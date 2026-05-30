import React from 'react'
import ThemeProvider from '../components/ThemeProvider'
import LandingPage from '../components/LandingPage'

export default function HomePage() {
  return (
    <ThemeProvider>
      <LandingPage />
    </ThemeProvider>
  )
}
