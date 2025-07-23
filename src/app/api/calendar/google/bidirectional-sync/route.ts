import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { GoogleCalendarService } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient({ cookies })
    const { eventId, action } = await request.json()

    // Récupérer les tokens Google de l'utilisateur
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ 
        error: 'Aucune autorisation Google Calendar trouvée',
        needsAuth: true 
      }, { status: 401 })
    }

    // Vérifier si le token a expiré et le rafraîchir si nécessaire
    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    if (expiresAt <= now && tokenData.refresh_token) {
      try {
        const newTokens = await GoogleCalendarService.refreshAccessToken(
          tokenData.refresh_token,
          process.env.GOOGLE_CLIENT_ID!,
          process.env.GOOGLE_CLIENT_SECRET!
        )

        accessToken = newTokens.access_token

        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: newTokens.access_token,
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

      } catch (refreshError) {
        return NextResponse.json({ 
          error: 'Token expiré - Réautorisation nécessaire',
          needsAuth: true 
        }, { status: 401 })
      }
    }

    if (action === 'sync_single') {
      // Synchroniser un événement spécifique
      const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

      if (eventError || !event) {
        return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
      }

      await GoogleCalendarService.syncLocalEventToGoogle(accessToken, event, supabase)

      return NextResponse.json({
        success: true,
        message: 'Événement synchronisé avec Google Calendar'
      })
    }

    if (action === 'sync_all') {
      // Synchroniser tous les événements locaux vers Google
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('organizer_id', user.id)
        .gte('start_datetime', new Date().toISOString()) // Seulement les événements futurs

      if (eventsError) {
        return NextResponse.json({ error: 'Erreur récupération événements' }, { status: 500 })
      }

      let synced = 0
      let errors = 0
      const errorDetails: string[] = []

      for (const event of events || []) {
        try {
          await GoogleCalendarService.syncLocalEventToGoogle(accessToken, event, supabase)
          synced++
        } catch (error) {
          errors++
          errorDetails.push(`${event.title}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
      }

      return NextResponse.json({
        success: true,
        message: `${synced} événements synchronisés vers Google Calendar`,
        details: { synced, errors, errorDetails }
      })
    }

    if (action === 'delete_from_google') {
      // Supprimer un événement de Google Calendar
      const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .select('external_id, title')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

      if (eventError || !event) {
        return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
      }

      if (event.external_id) {
        await GoogleCalendarService.deleteEventInGoogle(accessToken, event.external_id)
        
        // Mettre à jour l'événement local pour supprimer les infos Google
        await supabase
          .from('calendar_events')
          .update({
            external_id: null,
            external_link: null,
            source: 'manual',
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId)
      }

      return NextResponse.json({
        success: true,
        message: 'Événement supprimé de Google Calendar'
      })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })

  } catch (error) {
    console.error('Erreur synchronisation bidirectionnelle:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}