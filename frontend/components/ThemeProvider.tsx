'use client'

import React, { createContext, useContext, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext({ theme: 'dark' as Theme, setTheme: (_t: Theme) => {} })

export function useTheme(){
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }){
  const [theme, setTheme] = useState<Theme>('dark')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`ff-theme ff-theme-${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
