/**
 * Service d'intégration avec Google Calendar
 * Note: Nécessite la configuration OAuth2 Google dans les variables d'environnement
 */

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  status: string
  htmlLink: string
}

export class GoogleCalendarService {
  
  /**
   * Génère une URL d'autorisation Google Calendar
   */
  static generateAuthUrl(clientId: string, redirectUri: string): string {
    const scope = 'https://www.googleapis.com/auth/calendar'
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * Échange le code d'autorisation contre un token d'accès
   */
  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error(`Erreur échange token: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Récupère les événements du calendrier principal de l'utilisateur
   */
  static async fetchUserEvents(
    accessToken: string,
    timeMin?: Date,
    timeMax?: Date,
    maxResults = 50
  ): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      orderBy: 'startTime',
      singleEvents: 'true',
    })

    if (timeMin) {
      params.append('timeMin', timeMin.toISOString())
    }

    if (timeMax) {
      params.append('timeMax', timeMax.toISOString())
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Erreur récupération événements: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  }

  /**
   * Convertit un événement Google Calendar vers notre format
   */
  static convertGoogleEventToLocal(googleEvent: GoogleCalendarEvent): {
    title: string
    description?: string
    start_datetime: string
    end_datetime: string
    all_day: boolean
    location?: string
    external_id: string
    external_link: string
  } {
    const isAllDay = !googleEvent.start.dateTime
    
    return {
      title: googleEvent.summary,
      description: googleEvent.description,
      start_datetime: googleEvent.start.dateTime || `${googleEvent.start.date}T00:00:00Z`,
      end_datetime: googleEvent.end.dateTime || `${googleEvent.end.date}T23:59:59Z`,
      all_day: isAllDay,
      location: googleEvent.location,
      external_id: googleEvent.id,
      external_link: googleEvent.htmlLink
    }
  }

  /**
   * Synchronise les événements Google Calendar avec notre base de données
   * (À implémenter côté serveur avec les tokens utilisateur)
   */
  static async syncWithDatabase(
    userId: string,
    accessToken: string,
    supabaseClient: any // Type Supabase client
  ): Promise<{ imported: number; updated: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0
    let updated = 0

    try {
      // Récupérer les événements des 30 derniers jours et 90 prochains jours
      const timeMin = new Date()
      timeMin.setDate(timeMin.getDate() - 30)
      const timeMax = new Date()
      timeMax.setDate(timeMax.getDate() + 90)

      const googleEvents = await this.fetchUserEvents(accessToken, timeMin, timeMax, 100)

      for (const googleEvent of googleEvents) {
        try {
          const localEvent = this.convertGoogleEventToLocal(googleEvent)
          
          // Vérifier si l'événement existe déjà
          const { data: existingEvent } = await supabaseClient
            .from('calendar_events')
            .select('id')
            .eq('external_id', googleEvent.id)
            .eq('organizer_id', userId)
            .single()

          if (existingEvent) {
            // Mettre à jour l'événement existant
            const { error } = await supabaseClient
              .from('calendar_events')
              .update({
                title: localEvent.title,
                description: localEvent.description,
                start_datetime: localEvent.start_datetime,
                end_datetime: localEvent.end_datetime,
                all_day: localEvent.all_day,
                location: localEvent.location,
                external_link: localEvent.external_link,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingEvent.id)

            if (error) {
              errors.push(`Erreur mise à jour événement ${googleEvent.summary}: ${error.message}`)
            } else {
              updated++
            }
          } else {
            // Créer un nouvel événement
            const { error } = await supabaseClient
              .from('calendar_events')
              .insert({
                ...localEvent,
                organizer_id: userId,
                event_type: 'other', // Type par défaut pour les événements Google
                source: 'google_calendar',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })

            if (error) {
              errors.push(`Erreur création événement ${googleEvent.summary}: ${error.message}`)
            } else {
              imported++
            }
          }
        } catch (eventError) {
          errors.push(`Erreur traitement événement ${googleEvent.summary}: ${eventError}`)
        }
      }

    } catch (error) {
      errors.push(`Erreur synchronisation: ${error}`)
    }

    return { imported, updated, errors }
  }

  /**
   * Rafraîchit un token d'accès expiré
   */
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{
    access_token: string
    expires_in: number
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!response.ok) {
      throw new Error(`Erreur refresh token: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Crée un événement dans Google Calendar
   */
  static async createEventInGoogle(
    accessToken: string,
    event: {
      title: string
      description?: string
      start_datetime: string
      end_datetime: string
      all_day: boolean
      location?: string
    }
  ): Promise<GoogleCalendarEvent> {
    const eventData = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.all_day 
        ? { date: event.start_datetime.split('T')[0] }
        : { dateTime: event.start_datetime, timeZone: 'Europe/Paris' },
      end: event.all_day 
        ? { date: event.end_datetime.split('T')[0] }
        : { dateTime: event.end_datetime, timeZone: 'Europe/Paris' }
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Erreur création événement Google: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Met à jour un événement dans Google Calendar
   */
  static async updateEventInGoogle(
    accessToken: string,
    googleEventId: string,
    event: {
      title: string
      description?: string
      start_datetime: string
      end_datetime: string
      all_day: boolean
      location?: string
    }
  ): Promise<GoogleCalendarEvent> {
    const eventData = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.all_day 
        ? { date: event.start_datetime.split('T')[0] }
        : { dateTime: event.start_datetime, timeZone: 'Europe/Paris' },
      end: event.all_day 
        ? { date: event.end_datetime.split('T')[0] }
        : { dateTime: event.end_datetime, timeZone: 'Europe/Paris' }
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      }
    )

    if (!response.ok) {
      throw new Error(`Erreur mise à jour événement Google: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Supprime un événement dans Google Calendar
   */
  static async deleteEventInGoogle(
    accessToken: string,
    googleEventId: string
  ): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok && response.status !== 404) {
      throw new Error(`Erreur suppression événement Google: ${response.statusText}`)
    }
  }

  /**
   * Synchronise un événement local vers Google Calendar
   */
  static async syncLocalEventToGoogle(
    accessToken: string,
    localEvent: any,
    supabaseClient: any
  ): Promise<void> {
    try {
      const eventData = {
        title: localEvent.title,
        description: localEvent.description,
        start_datetime: localEvent.start_datetime,
        end_datetime: localEvent.end_datetime,
        all_day: localEvent.all_day,
        location: localEvent.location
      }

      if (localEvent.external_id && localEvent.source === 'google_calendar') {
        // Événement vient de Google, on le met à jour
        await this.updateEventInGoogle(accessToken, localEvent.external_id, eventData)
      } else if (!localEvent.external_id || localEvent.source === 'manual') {
        // Événement local, on le crée dans Google
        const googleEvent = await this.createEventInGoogle(accessToken, eventData)
        
        // Mettre à jour l'événement local avec l'ID Google
        await supabaseClient
          .from('calendar_events')
          .update({
            external_id: googleEvent.id,
            external_link: googleEvent.htmlLink,
            source: 'bidirectional',
            updated_at: new Date().toISOString()
          })
          .eq('id', localEvent.id)
      }
    } catch (error) {
      console.error(`Erreur sync événement ${localEvent.id} vers Google:`, error)
      throw error
    }
  }
}