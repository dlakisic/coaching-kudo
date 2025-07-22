'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { EVENT_COLORS, type EventType } from '@/constants'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  event_type: EventType
  start_datetime: string
  end_datetime: string
  all_day: boolean
  location?: string
  color?: string
  organizer: {
    name: string
  }
  participants?: Array<{
    participant_id: string
    status: string
    participant: {
      name: string
    }
  }>
}

interface EventsListProps {
  events: CalendarEvent[]
  title: string
  onEventClick?: (event: CalendarEvent) => void
  showDate?: boolean
}

export default function EventsList({ events, title, onEventClick, showDate = true }: EventsListProps) {
  const getEventTypeLabel = (type: EventType) => {
    const labels = {
      training: 'Entraînement',
      competition: 'Compétition',
      individual_session: 'Session individuelle',
      meeting: 'Réunion',
      other: 'Autre'
    }
    return labels[type] || type
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📅</div>
          <p>Aucun événement à afficher</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-600">{events.length} événement(s)</p>
      </div>

      <div className="divide-y">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Event Color Indicator */}
              <div
                className="w-1 h-16 rounded-full flex-shrink-0 mt-1"
                style={{
                  backgroundColor: event.color || EVENT_COLORS[event.event_type] || EVENT_COLORS.other
                }}
              ></div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {getEventTypeLabel(event.event_type)}
                      </span>
                      <span>Par {event.organizer.name}</span>
                    </div>

                    {/* Date and Time */}
                    <div className="mt-2 text-sm text-gray-600">
                      {showDate && (
                        <>
                          {event.all_day ? (
                            <div>
                              📅 {format(new Date(event.start_datetime), 'EEEE d MMMM yyyy', { locale: fr })}
                              <span className="ml-2 text-gray-500">(Toute la journée)</span>
                            </div>
                          ) : (
                            <div>
                              📅 {format(new Date(event.start_datetime), 'EEEE d MMMM', { locale: fr })} de{' '}
                              {format(new Date(event.start_datetime), 'HH:mm')} à{' '}
                              {format(new Date(event.end_datetime), 'HH:mm')}
                            </div>
                          )}
                        </>
                      )}

                      {!showDate && !event.all_day && (
                        <div>
                          🕒 {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
                        </div>
                      )}

                      {event.location && (
                        <div className="mt-1">
                          📍 {event.location}
                        </div>
                      )}
                    </div>

                    {/* Participants Count */}
                    {event.participants && event.participants.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        👥 {event.participants.length} participant(s)
                        {event.participants.filter(p => p.status === 'accepted').length > 0 && (
                          <span className="text-green-600 ml-2">
                            ({event.participants.filter(p => p.status === 'accepted').length} confirmé(s))
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description Preview */}
                    {event.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Quick Status Info */}
                  <div className="flex-shrink-0 text-right">
                    {event.participants && (
                      <div className="text-xs text-gray-500">
                        {event.participants.filter(p => p.status === 'accepted').length}/{event.participants.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}