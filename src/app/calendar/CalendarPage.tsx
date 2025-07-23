'use client'

import { useState } from 'react'
import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import CalendarView from '@/components/calendar/CalendarView'
import EventsList from '@/components/calendar/EventsList'
import EventModal from '@/components/calendar/EventModal'
import EventForm from '@/components/calendar/EventForm'
import GoogleCalendarIntegration from '@/components/calendar/GoogleCalendarIntegration'
import GoogleCalendarSync from '@/components/calendar/GoogleCalendarSync'
import { useCalendar } from '@/hooks/useCalendar'
import { type EventFormInput } from '@/schemas'
import { type CoachLevel } from '@/constants'

interface User {
  id: string
  role: string
  coachLevel?: CoachLevel
}

interface Athlete {
  id: string
  name: string
  email: string
}

interface CalendarPageProps {
  user: User
  athletes: Athlete[]
}

export default function CalendarPage({ user, athletes }: CalendarPageProps) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getTodayEvents,
    refreshEvents
  } = useCalendar({
    userId: user.id,
    userRole: user.role,
    coachLevel: user.coachLevel
  })

  const handleCreateEvent = async (formData: EventFormInput) => {
    try {
      await createEvent(formData)
      setShowEventForm(false)
      setSelectedDate(null)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleUpdateEvent = async (formData: EventFormInput) => {
    if (!editingEvent) return
    
    try {
      await updateEvent(editingEvent.id, formData)
      setEditingEvent(null)
      setSelectedEvent(null)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setSelectedEvent(null)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleDateClick = (date: Date) => {
    if (user.role === 'coach') {
      setSelectedDate(date)
      setShowEventForm(true)
    }
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setSelectedEvent(null)
  }

  // Préparer les données pour le formulaire d'édition
  const getEditFormData = (event: any): Partial<EventFormInput> => {
    return {
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      startDate: format(new Date(event.start_datetime), 'yyyy-MM-dd'),
      startTime: event.all_day ? '' : format(new Date(event.start_datetime), 'HH:mm'),
      endDate: format(new Date(event.end_datetime), 'yyyy-MM-dd'),
      endTime: event.all_day ? '' : format(new Date(event.end_datetime), 'HH:mm'),
      allDay: event.all_day,
      location: event.location,
      maxParticipants: event.max_participants?.toString(),
      visibility: event.visibility,
      participants: event.participants?.map((p: any) => p.participant_id) || []
    }
  }

  const todayEvents = events.filter(event => 
    isToday(new Date(event.start_datetime))
  )

  if (loading && events.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-gray-600">
            Gérez vos entraînements, compétitions et événements
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'calendar' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Calendrier
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Liste
            </button>
          </div>

          {/* New Event Button */}
          {user.role === 'coach' && (
            <button
              onClick={() => setShowEventForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nouvel événement
            </button>
          )}
        </div>
      </div>

      {/* Google Calendar Integration */}
      <div className="space-y-4">
        <GoogleCalendarIntegration />
        <GoogleCalendarSync onSyncComplete={refreshEvents} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Today's Events Summary */}
      {todayEvents.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🗓️ Aujourd'hui ({todayEvents.length} événement{todayEvents.length > 1 ? 's' : ''})
          </h3>
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => handleEventClick(event)}
                className="flex items-center gap-3 text-sm text-blue-800 dark:text-blue-200 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: event.color || '#3b82f6' }}
                ></div>
                <span className="font-medium">{event.title}</span>
                {!event.all_day && (
                  <span className="text-blue-600 dark:text-blue-300">
                    {format(new Date(event.start_datetime), 'HH:mm')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {view === 'calendar' ? (
        <CalendarView
          events={events}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      ) : (
        <EventsList
          events={events}
          title="Tous les événements"
          onEventClick={handleEventClick}
        />
      )}

      {/* Event Details Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        currentUserId={user.id}
        userRole={user.role}
      />

      {/* Event Creation Form */}
      <EventForm
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false)
          setSelectedDate(null)
        }}
        onSubmit={handleCreateEvent}
        athletes={athletes}
        initialDate={selectedDate || undefined}
      />

      {/* Event Edit Form */}
      <EventForm
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSubmit={handleUpdateEvent}
        athletes={athletes}
        initialData={editingEvent ? getEditFormData(editingEvent) : undefined}
      />
    </div>
  )
}