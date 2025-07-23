'use client'

import { useState, useEffect } from 'react'
import { CalendarService } from '@/services/CalendarService'
import { createClientComponentClient } from '@/lib/supabase'
import { type EventFormInput, type CreateEventInput } from '@/schemas'
import { type CoachLevel } from '@/constants'

interface UseCalendarProps {
  userId: string
  userRole: string
  coachLevel?: CoachLevel
}

export function useCalendar({ userId, userRole, coachLevel }: UseCalendarProps) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Fetch events
  const fetchEvents = async (filters?: {
    startDate?: Date
    endDate?: Date
    eventType?: string
    organizerId?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await CalendarService.getEvents(
        userId,
        userRole,
        coachLevel,
        filters
      )
      
      setEvents(data)
    } catch (err: any) {
      console.error('Error fetching events:', err)
      setError(err.message || 'Erreur lors de la récupération des événements')
    } finally {
      setLoading(false)
    }
  }

  // Create event
  const createEvent = async (formData: EventFormInput) => {
    try {
      setError(null)

      // Transform form data to API format
      const eventData: CreateEventInput = {
        title: formData.title,
        description: formData.description,
        event_type: formData.eventType,
        start_datetime: formData.allDay 
          ? new Date(formData.startDate).toISOString()
          : new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
        end_datetime: formData.allDay
          ? new Date(formData.endDate).toISOString()
          : new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
        all_day: formData.allDay,
        location: formData.location,
        organizer_id: userId,
        max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants.toString()) : undefined,
        visibility: formData.visibility
      }

      const newEvent = await CalendarService.createEvent(eventData, supabase)

      // Add participants if provided
      if (formData.participants && formData.participants.length > 0) {
        await Promise.all(
          formData.participants.map(participantId =>
            CalendarService.addParticipant(
              {
                event_id: newEvent.id,
                participant_id: participantId,
                status: 'invited'
              },
              userId
            )
          )
        )
      }

      // Auto-sync to Google Calendar if user has connected their account
      try {
        await fetch('/api/calendar/google/bidirectional-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: newEvent.id,
            action: 'sync_single'
          })
        })
      } catch (syncError) {
        console.warn('Google Calendar sync failed (non-critical):', syncError)
      }

      // Refresh events
      await fetchEvents()
      
      return newEvent
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Erreur lors de la création de l\'événement')
      throw err
    }
  }

  // Update event
  const updateEvent = async (eventId: string, formData: EventFormInput) => {
    try {
      setError(null)

      const eventData = {
        id: eventId,
        title: formData.title,
        description: formData.description,
        event_type: formData.eventType,
        start_datetime: formData.allDay 
          ? new Date(formData.startDate).toISOString()
          : new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
        end_datetime: formData.allDay
          ? new Date(formData.endDate).toISOString()
          : new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
        all_day: formData.allDay,
        location: formData.location,
        max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants.toString()) : undefined,
        visibility: formData.visibility
      }

      const updatedEvent = await CalendarService.updateEvent(eventData, userId, coachLevel)

      // Auto-sync to Google Calendar if user has connected their account
      try {
        await fetch('/api/calendar/google/bidirectional-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: eventId,
            action: 'sync_single'
          })
        })
      } catch (syncError) {
        console.warn('Google Calendar sync failed (non-critical):', syncError)
      }

      // Refresh events
      await fetchEvents()
      
      return updatedEvent
    } catch (err: any) {
      console.error('Error updating event:', err)
      setError(err.message || 'Erreur lors de la mise à jour de l\'événement')
      throw err
    }
  }

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      setError(null)
      
      // Delete from Google Calendar first if synced
      try {
        await fetch('/api/calendar/google/bidirectional-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: eventId,
            action: 'delete_from_google'
          })
        })
      } catch (syncError) {
        console.warn('Google Calendar delete failed (non-critical):', syncError)
      }
      
      await CalendarService.deleteEvent(eventId, userId, coachLevel)
      
      // Refresh events
      await fetchEvents()
    } catch (err: any) {
      console.error('Error deleting event:', err)
      setError(err.message || 'Erreur lors de la suppression de l\'événement')
      throw err
    }
  }

  // Get today's events
  const getTodayEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await CalendarService.getTodayEvents(userId, userRole, coachLevel)
      return data
    } catch (err: any) {
      console.error('Error fetching today events:', err)
      setError(err.message || 'Erreur lors de la récupération des événements du jour')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Get week events
  const getWeekEvents = async (weekStart?: Date) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await CalendarService.getWeekEvents(userId, userRole, coachLevel, weekStart)
      return data
    } catch (err: any) {
      console.error('Error fetching week events:', err)
      setError(err.message || 'Erreur lors de la récupération des événements de la semaine')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Get calendar statistics
  const getCalendarStats = async () => {
    if (userRole !== 'coach') return null

    try {
      const stats = await CalendarService.getCalendarStats(userId, userRole, coachLevel)
      return stats
    } catch (err: any) {
      console.error('Error fetching calendar stats:', err)
      return null
    }
  }

  // Update participant status
  const updateParticipantStatus = async (
    eventId: string,
    participantId: string,
    status: string,
    coachNotes?: string
  ) => {
    try {
      setError(null)
      
      await CalendarService.updateParticipant(
        {
          event_id: eventId,
          participant_id: participantId,
          status,
          coach_notes: coachNotes
        },
        userId,
        userRole
      )
      
      // Refresh events
      await fetchEvents()
    } catch (err: any) {
      console.error('Error updating participant status:', err)
      setError(err.message || 'Erreur lors de la mise à jour du statut')
      throw err
    }
  }

  // Add participant
  const addParticipant = async (eventId: string, participantId: string) => {
    try {
      setError(null)
      
      await CalendarService.addParticipant(
        {
          event_id: eventId,
          participant_id: participantId,
          status: 'invited'
        },
        userId
      )
      
      // Refresh events
      await fetchEvents()
    } catch (err: any) {
      console.error('Error adding participant:', err)
      setError(err.message || 'Erreur lors de l\'ajout du participant')
      throw err
    }
  }

  // Remove participant
  const removeParticipant = async (eventId: string, participantId: string) => {
    try {
      setError(null)
      
      await CalendarService.removeParticipant(eventId, participantId, userId)
      
      // Refresh events
      await fetchEvents()
    } catch (err: any) {
      console.error('Error removing participant:', err)
      setError(err.message || 'Erreur lors de la suppression du participant')
      throw err
    }
  }

  // Initial load
  useEffect(() => {
    fetchEvents()
  }, [userId, userRole, coachLevel])

  return {
    events,
    loading,
    error,
    
    // Actions
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getTodayEvents,
    getWeekEvents,
    getCalendarStats,
    updateParticipantStatus,
    addParticipant,
    removeParticipant,
    
    // Utils
    refreshEvents: fetchEvents
  }
}