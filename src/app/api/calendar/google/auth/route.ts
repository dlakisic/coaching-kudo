import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { GoogleCalendarService } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/google/callback`

    if (!clientId) {
      return NextResponse.json({ 
        error: 'Configuration Google Calendar manquante',
        instructions: 'Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local'
      }, { status: 500 })
    }

    if (action === 'connect') {
      // Générer l'URL d'autorisation Google
      const authUrl = GoogleCalendarService.generateAuthUrl(clientId, redirectUri)
      
      return NextResponse.json({ 
        authUrl,
        message: 'Utilisez cette URL pour autoriser l\'accès à Google Calendar'
      })
    }

    return NextResponse.json({ 
      error: 'Action non reconnue. Utilisez ?action=connect' 
    }, { status: 400 })

  } catch (error) {
    console.error('Erreur API Google Calendar auth:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}