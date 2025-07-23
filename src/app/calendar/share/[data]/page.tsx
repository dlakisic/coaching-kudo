import { notFound } from 'next/navigation'
import { CalendarExportService } from '@/lib/calendar-export'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PageProps {
  params: {
    data: string
  }
}

export default function SharedEventPage({ params }: PageProps) {
  const eventData = CalendarExportService.parseShareableLink(params.data)

  if (!eventData) {
    notFound()
  }

  const startDate = eventData.start ? new Date(eventData.start) : null
  const endDate = eventData.end ? new Date(eventData.end) : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">🥋 Coaching Kudo</h1>
                <p className="text-blue-100">Événement partagé</p>
              </div>
              <div className="text-4xl opacity-80">📅</div>
            </div>
          </div>

          {/* Contenu de l'événement */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {eventData.title}
            </h2>

            <div className="space-y-4">
              {/* Date et heure */}
              {startDate && (
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🕒</div>
                  <div>
                    <div className="font-medium text-gray-900">Date et heure</div>
                    <div className="text-gray-600">
                      {format(startDate, 'EEEE d MMMM yyyy', { locale: fr })}
                      {endDate && startDate.toDateString() !== endDate.toDateString() && (
                        <span> - {format(endDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                      )}
                    </div>
                    <div className="text-gray-600">
                      {format(startDate, 'HH:mm')}
                      {endDate && <span> - {format(endDate, 'HH:mm')}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Lieu */}
              {eventData.location && (
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📍</div>
                  <div>
                    <div className="font-medium text-gray-900">Lieu</div>
                    <div className="text-gray-600">{eventData.location}</div>
                  </div>
                </div>
              )}

              {/* Description */}
              {eventData.description && (
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📝</div>
                  <div>
                    <div className="font-medium text-gray-900">Description</div>
                    <div className="text-gray-600 whitespace-pre-wrap">
                      {eventData.description}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {startDate && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">
                  📅 Ajouter à votre calendrier
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <AddToCalendarButton
                    type="google"
                    event={{
                      title: eventData.title || '',
                      description: eventData.description || '',
                      start: eventData.start || '',
                      end: eventData.end || '',
                      location: eventData.location || ''
                    }}
                  />
                  
                  <AddToCalendarButton
                    type="outlook"
                    event={{
                      title: eventData.title || '',
                      description: eventData.description || '',
                      start: eventData.start || '',
                      end: eventData.end || '',
                      location: eventData.location || ''
                    }}
                  />
                  
                  <AddToCalendarButton
                    type="yahoo"
                    event={{
                      title: eventData.title || '',
                      description: eventData.description || '',
                      start: eventData.start || '',
                      end: eventData.end || '',
                      location: eventData.location || ''
                    }}
                  />
                  
                  <AddToCalendarButton
                    type="apple"
                    event={{
                      title: eventData.title || '',
                      description: eventData.description || '',
                      start: eventData.start || '',
                      end: eventData.end || '',
                      location: eventData.location || ''
                    }}
                  />
                </div>
              </div>
            )}

            {/* Note */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 text-lg">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <strong>Cet événement vous a été partagé depuis l'application Coaching Kudo.</strong>
                  <br />
                  Pour voir d'autres événements et accéder à toutes les fonctionnalités,{' '}
                  <a href="/" className="underline hover:no-underline">
                    connectez-vous à l'application
                  </a>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AddToCalendarButtonProps {
  type: 'google' | 'outlook' | 'yahoo' | 'apple'
  event: {
    title: string
    description: string
    start: string
    end: string
    location: string
  }
}

function AddToCalendarButton({ type, event }: AddToCalendarButtonProps) {
  const links = CalendarExportService.generateCalendarLinks({
    id: 'shared',
    title: event.title,
    description: event.description,
    start_datetime: event.start,
    end_datetime: event.end,
    all_day: false,
    location: event.location,
    event_type: 'shared'
  })

  const config = {
    google: { icon: '🔵', label: 'Google Calendar', url: links.google },
    outlook: { icon: '🟦', label: 'Outlook', url: links.outlook },
    yahoo: { icon: '🟪', label: 'Yahoo', url: links.yahoo },
    apple: { icon: '🍎', label: 'Apple Calendar', url: links.apple }
  }

  const handleClick = () => {
    if (type === 'apple') {
      // Pour Apple Calendar, on télécharge un fichier iCal
      CalendarExportService.downloadICalFile([{
        id: 'shared',
        title: event.title,
        description: event.description,
        start_datetime: event.start,
        end_datetime: event.end,
        all_day: false,
        location: event.location,
        event_type: 'shared'
      }], `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`)
    } else {
      window.open(config[type].url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <span className="text-2xl mr-2">{config[type].icon}</span>
      <span className="text-gray-900 font-medium">{config[type].label}</span>
    </button>
  )
}