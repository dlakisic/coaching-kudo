import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { CalendarExportService } from '@/lib/calendar-export'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const format = searchParams.get('format') || 'ical'
    const range = searchParams.get('range') || '3months' // 1month, 3months, 6months, 1year, all
    const eventType = searchParams.get('type') // optionnel: filtrer par type d'événement

    const supabase = await createServerComponentClient({ cookies })

    // Calculer la plage de dates
    const now = new Date()
    let startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1) // Mois précédent
    let endDate: Date

    switch (range) {
      case '1month':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case '3months':
        endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
        break
      case '6months':
        endDate = new Date(now.getFullYear(), now.getMonth() + 6, 0)
        break
      case '1year':
        endDate = new Date(now.getFullYear() + 1, now.getMonth(), 0)
        break
      case 'all':
        startDate = new Date(2020, 0, 1) // Date très ancienne
        endDate = new Date(2030, 11, 31) // Date très future
        break
      default:
        endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
    }

    // Construction de la requête
    let query = supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        description,
        event_type,
        start_datetime,
        end_datetime,
        all_day,
        location,
        organizer:organizer_id (
          name,
          email
        )
      `)
      .gte('start_datetime', startDate.toISOString())
      .lte('start_datetime', endDate.toISOString())
      .order('start_datetime')

    // Filtrer par type d'événement si spécifié
    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType)
    }

    // Filtrer selon les permissions utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, coach_level')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // Les athlètes ne voient que leurs événements
    if (profile.role === 'athlete') {
      query = query.or(`organizer_id.eq.${user.id},participants.participant_id.eq.${user.id}`)
    }
    // Les coachs voient leurs événements + ceux de leurs athlètes selon leur niveau
    else if (profile.role === 'coach' && profile.coach_level !== 'super_admin') {
      // Pour l'instant, on garde simple : tous les événements pour les coachs
      // On pourrait affiner selon la hiérarchie plus tard
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Erreur récupération événements:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ 
        message: 'Aucun événement trouvé pour la période sélectionnée',
        events: []
      })
    }

    // Formater les événements pour l'export
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      all_day: event.all_day,
      location: event.location,
      event_type: event.event_type,
      organizer: event.organizer
    }))

    if (format === 'json') {
      return NextResponse.json({ events: formattedEvents })
    }

    if (format === 'ical') {
      const icalContent = CalendarExportService.generateICalFile(
        formattedEvents,
        `Coaching Kudo - ${profile.role === 'coach' ? 'Coach' : 'Athlète'}`
      )

      return new NextResponse(icalContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="coaching-kudo-${range}.ics"`
        }
      })
    }

    return NextResponse.json({ error: 'Format non supporté' }, { status: 400 })

  } catch (error) {
    console.error('Erreur API export calendar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'ID événement requis' }, { status: 400 })
    }

    const supabase = await createServerComponentClient({ cookies })

    // Récupérer l'événement spécifique
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        description,
        event_type,
        start_datetime,
        end_datetime,
        all_day,
        location,
        organizer:organizer_id (
          name,
          email
        )
      `)
      .eq('id', eventId)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Générer les liens de calendrier
    const calendarLinks = CalendarExportService.generateCalendarLinks({
      id: event.id,
      title: event.title,
      description: event.description,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      all_day: event.all_day,
      location: event.location,
      event_type: event.event_type,
      organizer: event.organizer
    })

    return NextResponse.json({ 
      event,
      calendarLinks,
      shareableLink: CalendarExportService.generateShareableLink(
        event,
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      )
    })

  } catch (error) {
    console.error('Erreur API export single event:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}