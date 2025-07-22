import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider, ThemeScript } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Coaching Kudo',
  description: 'Application de suivi et coaching pour le kudo',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Coaching Kudo',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Coaching Kudo',
    title: 'Coaching Kudo - Gestion d\'Entraînement',
    description: 'Application de gestion d\'entraînement pour clubs de Kudo',
  },
  twitter: {
    card: 'summary',
    title: 'Coaching Kudo',
    description: 'Application de gestion d\'entraînement pour clubs de Kudo',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' }
  ],
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Coaching Kudo" />
        <meta name="application-name" content="Coaching Kudo" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}