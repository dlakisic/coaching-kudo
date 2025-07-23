import { format } from 'date-fns'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_datetime: string
  end_datetime: string
  all_day: boolean
  location?: string
  event_type: string
  organizer?: {
    name: string
    email?: string
  }
}

/**
 * Service d'export de calendrier vers différents formats
 */
export class CalendarExportService {
  
  /**
   * Génère un fichier iCal (.ics) à partir d'événements
   */
  static generateICalFile(events: CalendarEvent[], calendarName = 'Coaching Kudo'): string {
    const now = new Date()
    const timestamp = format(now, 'yyyyMMdd\'T\'HHmmss\'Z\'')
    
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Coaching Kudo//Calendar Export//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calendarName}`,
      'X-WR-TIMEZONE:Europe/Paris',
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Paris',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE'
    ]

    // Ajouter chaque événement
    events.forEach(event => {
      const startDate = new Date(event.start_datetime)
      const endDate = new Date(event.end_datetime)
      
      const formatDate = (date: Date, allDay: boolean) => {
        if (allDay) {
          return format(date, 'yyyyMMdd')
        }
        return format(date, 'yyyyMMdd\'T\'HHmmss\'Z\'')
      }

      const eventLines = [
        'BEGIN:VEVENT',
        `UID:${event.id}@coaching-kudo.com`,
        `DTSTAMP:${timestamp}`,
        `DTSTART${event.all_day ? ';VALUE=DATE' : ';TZID=Europe/Paris'}:${formatDate(startDate, event.all_day)}`,
        `DTEND${event.all_day ? ';VALUE=DATE' : ';TZID=Europe/Paris'}:${formatDate(endDate, event.all_day)}`,
        `SUMMARY:${this.escapeICalText(event.title)}`,
        `CATEGORIES:${event.event_type.toUpperCase()}`,
      ]

      if (event.description) {
        eventLines.push(`DESCRIPTION:${this.escapeICalText(event.description)}`)
      }

      if (event.location) {
        eventLines.push(`LOCATION:${this.escapeICalText(event.location)}`)
      }

      if (event.organizer) {
        const organizerString = event.organizer.email 
          ? `CN=${event.organizer.name}:mailto:${event.organizer.email}`
          : event.organizer.name
        eventLines.push(`ORGANIZER:${organizerString}`)
      }

      eventLines.push('STATUS:CONFIRMED')
      eventLines.push('TRANSP:OPAQUE')
      eventLines.push('END:VEVENT')

      ical = ical.concat(eventLines)
    })

    ical.push('END:VCALENDAR')
    
    return ical.join('\n')
  }

  /**
   * Télécharge un fichier iCal
   */
  static downloadICalFile(events: CalendarEvent[], filename = 'coaching-kudo-calendar.ics') {
    const icalContent = this.generateICalFile(events)
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    
    URL.revokeObjectURL(url)
  }

  /**
   * Génère des liens rapides vers des services de calendrier externes
   */
  static generateCalendarLinks(event: CalendarEvent) {
    const startDate = new Date(event.start_datetime)
    const endDate = new Date(event.end_datetime)
    
    const formatForUrl = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    const startFormatted = formatForUrl(startDate)
    const endFormatted = formatForUrl(endDate)
    
    const title = encodeURIComponent(event.title)
    const description = encodeURIComponent(event.description || '')
    const location = encodeURIComponent(event.location || '')

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${description}&location=${location}`,
      
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startFormatted}&enddt=${endFormatted}&body=${description}&location=${location}`,
      
      yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startFormatted}&et=${endFormatted}&desc=${description}&in_loc=${location}`,
      
      // Format pour Apple Calendar (peut être ouvert via webcal://)
      apple: `data:text/calendar;charset=utf8,${encodeURIComponent(this.generateICalFile([event]))}`
    }
  }

  /**
   * Échappe le texte pour le format iCal
   */
  private static escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
  }

  /**
   * Génère un lien de partage d'événement
   */
  static generateShareableLink(event: CalendarEvent, baseUrl: string): string {
    const eventData = {
      title: event.title,
      start: event.start_datetime,
      end: event.end_datetime,
      description: event.description,
      location: event.location
    }
    
    const encodedData = btoa(JSON.stringify(eventData))
    return `${baseUrl}/calendar/share/${encodedData}`
  }

  /**
   * Parse un lien partagé
   */
  static parseShareableLink(encodedData: string): Partial<CalendarEvent> | null {
    try {
      const decoded = atob(encodedData)
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Erreur parsing lien partagé:', error)
      return null
    }
  }
}