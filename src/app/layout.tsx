import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="fr">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}