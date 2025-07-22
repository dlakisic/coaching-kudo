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
    try {
      const savedTheme = localStorage.getItem('coaching-kudo-theme') as Theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      
      const initialTheme = savedTheme || systemTheme
      setThemeState(initialTheme)
      
      // Appliquer immédiatement le thème au DOM
      const root = document.documentElement
      if (initialTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
    }
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

    try {
      localStorage.setItem('coaching-kudo-theme', theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('Toggling theme from', theme, 'to', newTheme) // Debug
    
    setThemeState(newTheme)
    
    // Force la mise à jour immédiate du DOM
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
      console.log('Added dark class') // Debug
    } else {
      root.classList.remove('dark')
      console.log('Removed dark class') // Debug
    }
    
    // Sauvegarder immédiatement
    try {
      localStorage.setItem('coaching-kudo-theme', newTheme)
      console.log('Saved theme to localStorage:', newTheme) // Debug
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
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
      } else {
        document.documentElement.classList.remove('dark')
      }
    })()
  `

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />
}