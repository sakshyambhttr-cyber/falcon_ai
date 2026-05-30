import React from 'react'
import '../styles/design.css'

export const metadata = {
  title: 'Founder Falcon',
  description: 'AI startup operating system'
}

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
