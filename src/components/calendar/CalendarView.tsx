'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
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

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
}

export default function CalendarView({ events, onEventClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Lundi
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime)
      return isSameDay(eventDate, day)
    })
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              ←
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 text-sm rounded-lg ${
              view === 'month' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 text-sm rounded-lg ${
              view === 'week' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semaine
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            
            return (
              <div
                key={day.toISOString()}
                onClick={() => onDateClick?.(day)}
                className={`
                  min-h-[80px] p-1 border border-gray-200 rounded cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-white hover:bg-gray-50 text-gray-900' : 'bg-gray-50 text-gray-400'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                
                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(event)
                      }}
                      className="px-2 py-1 text-xs rounded truncate cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: event.color || EVENT_COLORS[event.event_type] || EVENT_COLORS.other,
                        color: 'white'
                      }}
                      title={`${event.title} - ${event.organizer.name}`}
                    >
                      {event.all_day ? (
                        event.title
                      ) : (
                        `${format(new Date(event.start_datetime), 'HH:mm')} ${event.title}`
                      )}
                    </div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayEvents.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm font-medium mb-2 text-gray-900">Types d'événements :</div>
        <div className="flex flex-wrap gap-4">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm text-gray-600 capitalize">
                {type === 'training' && 'Entraînement'}
                {type === 'competition' && 'Compétition'}
                {type === 'individual_session' && 'Session individuelle'}
                {type === 'meeting' && 'Réunion'}
                {type === 'other' && 'Autre'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}