'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Charger le thème depuis localStorage au montage
  useEffect(() => {
    const savedTheme = localStorage.getItem('coaching-kudo-theme') as Theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    setThemeState(savedTheme || systemTheme)
    setMounted(true)
  }, [])

  // Appliquer le thème au document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('coaching-kudo-theme', theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setThemeState(theme === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  // Éviter le flash pendant l'hydratation
  if (!mounted) {
    return <div className="opacity-0">{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Script inline pour éviter le flash
export const ThemeScript = () => {
  const themeScript = `
    (function() {
      const theme = localStorage.getItem('coaching-kudo-theme') || 
                   (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    })()
  `

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />
}