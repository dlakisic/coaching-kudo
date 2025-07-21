import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider, ThemeScript } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Coaching Kudo',
  description: 'Application de suivi et coaching pour le kudo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}