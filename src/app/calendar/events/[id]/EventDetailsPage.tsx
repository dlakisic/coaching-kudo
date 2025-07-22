'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { CalendarService } from '@/services/CalendarService'
import { type CoachLevel, type EventType, type ParticipantStatus } from '@/constants'

interface User {
  id: string
  role: string
  coachLevel?: CoachLevel
}

interface Event {
  id: string
  title: string
  description?: string
  event_type: EventType
  start_datetime: string
  end_datetime: string
  all_day: boolean
  location?: string
  color?: string
  max_participants?: number
  visibility: string
  organizer_id: string
  organizer: {
    name: string
    email: string
    coach_level?: CoachLevel
  }
  participants?: Array<{
    participant_id: string
    status: ParticipantStatus
    coach_notes?: string
    responded_at?: string
    participant: {
      name: string
      email: string
      category?: string
    }
  }>
}

interface Athlete {
  id: string
  name: string
  email: string
  category?: string
}

interface EventDetailsPageProps {
  event: Event
  user: User
  athletes: Athlete[]
}

export default function EventDetailsPage({ event, user, athletes }: EventDetailsPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState('')

  const isOrganizer = event.organizer_id === user.id
  const canEdit = user.role === 'coach' && (isOrganizer || user.coachLevel === 'super_admin')
  
  const userParticipation = event.participants?.find(p => p.participant_id === user.id)

  const getEventTypeLabel = (type: EventType) => {
    const labels = {
      training: 'Entraînement',
      competition: 'Compétition',
      individual_session: 'Session individuelle',
      meeting: 'Réunion',
      other: 'Autre'
    }
    return labels[type]
  }

  const getParticipantStatusLabel = (status: ParticipantStatus) => {
    const labels = {
      invited: 'Invité',
      accepted: 'Accepté',
      declined: 'Refusé',
      maybe: 'Peut-être',
      attended: 'Présent',
      absent: 'Absent'
    }
    return labels[status]
  }

  const getStatusColor = (status: ParticipantStatus) => {
    const colors = {
      invited: 'text-gray-600 bg-gray-100',
      accepted: 'text-green-700 bg-green-100',
      declined: 'text-red-700 bg-red-100',
      maybe: 'text-yellow-700 bg-yellow-100',
      attended: 'text-blue-700 bg-blue-100',
      absent: 'text-red-600 bg-red-100'
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  const handleUpdateParticipantStatus = async (participantId: string, status: ParticipantStatus, coachNotes?: string) => {
    try {
      setLoading(true)
      setError(null)

      await CalendarService.updateParticipant(
        {
          event_id: event.id,
          participant_id: participantId,
          status,
          coach_notes: coachNotes
        },
        user.id,
        user.role
      )

      // Refresh the page to get updated data
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!selectedAthlete) return

    try {
      setLoading(true)
      setError(null)

      await CalendarService.addParticipant(
        {
          event_id: event.id,
          participant_id: selectedAthlete,
          status: 'invited'
        },
        user.id
      )

      setShowAddParticipant(false)
      setSelectedAthlete('')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout du participant')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce participant ?')) return

    try {
      setLoading(true)
      setError(null)

      await CalendarService.removeParticipant(event.id, participantId, user.id)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  // Filter available athletes (not already participating)
  const availableAthletes = athletes.filter(athlete => 
    !event.participants?.some(p => p.participant_id === athlete.id)
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/calendar" 
          className="text-gray-600 hover:text-gray-900"
        >
          ← Retour au calendrier
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Event Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                {getEventTypeLabel(event.event_type)}
              </span>
              <span>Organisé par {event.organizer.name}</span>
              <span className="capitalize">{event.visibility}</span>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/calendar/events/${event.id}/edit`}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Modifier
              </Link>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">📅 Date et heure</h3>
            {event.all_day ? (
              <p className="text-gray-700">
                {format(new Date(event.start_datetime), 'EEEE d MMMM yyyy', { locale: fr })}
                <span className="ml-2 text-sm text-gray-500">(Toute la journée)</span>
              </p>
            ) : (
              <div className="text-gray-700">
                <p>Début : {format(new Date(event.start_datetime), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</p>
                <p>Fin : {format(new Date(event.end_datetime), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</p>
              </div>
            )}
          </div>

          {event.location && (
            <div>
              <h3 className="font-semibold mb-3">📍 Lieu</h3>
              <p className="text-gray-700">{event.location}</p>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">📝 Description</h3>
            <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {event.description}
            </div>
          </div>
        )}
      </div>

      {/* User Response (if participant) */}
      {userParticipation && user.role === 'athlete' && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Votre réponse</h2>
          <div className="flex items-center gap-3">
            {(['accepted', 'declined', 'maybe'] as ParticipantStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleUpdateParticipantStatus(user.id, status)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                  userParticipation.status === status
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getParticipantStatusLabel(status)}
              </button>
            ))}
          </div>
          {userParticipation.status && (
            <p className="text-sm text-gray-600 mt-2">
              Statut actuel : <span className="font-medium">{getParticipantStatusLabel(userParticipation.status)}</span>
            </p>
          )}
        </div>
      )}

      {/* Participants */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            👥 Participants ({event.participants?.length || 0}
            {event.max_participants && `/${event.max_participants}`})
          </h2>
          
          {isOrganizer && availableAthletes.length > 0 && (
            <button
              onClick={() => setShowAddParticipant(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ajouter un participant
            </button>
          )}
        </div>

        {/* Add Participant Form */}
        {showAddParticipant && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedAthlete}
                onChange={(e) => setSelectedAthlete(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un athlète...</option>
                {availableAthletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name} {athlete.category && `(${athlete.category})`}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddParticipant}
                disabled={!selectedAthlete || loading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowAddParticipant(false)
                  setSelectedAthlete('')
                }}
                className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Participants List */}
        {event.participants && event.participants.length > 0 ? (
          <div className="space-y-3">
            {event.participants.map((participant) => (
              <div key={participant.participant_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{participant.participant.name}</div>
                  <div className="text-sm text-gray-600">
                    {participant.participant.email}
                    {participant.participant.category && (
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-full">
                        {participant.participant.category}
                      </span>
                    )}
                  </div>
                  {participant.coach_notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      Note : {participant.coach_notes}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(participant.status)}`}>
                    {getParticipantStatusLabel(participant.status)}
                  </span>
                  
                  {isOrganizer && (
                    <div className="flex gap-1">
                      {/* Status Actions for Organizer */}
                      {user.role === 'coach' && (
                        <select
                          value={participant.status}
                          onChange={(e) => handleUpdateParticipantStatus(
                            participant.participant_id, 
                            e.target.value as ParticipantStatus
                          )}
                          disabled={loading}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          {(['invited', 'accepted', 'declined', 'maybe', 'attended', 'absent'] as ParticipantStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {getParticipantStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <button
                        onClick={() => handleRemoveParticipant(participant.participant_id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👥</div>
            <p>Aucun participant pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}