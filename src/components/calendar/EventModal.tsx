'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Modal from '@/components/ui/Modal'
import { type EventType, type ParticipantStatus } from '@/constants'

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
  max_participants?: number
  organizer: {
    name: string
  }
  participants?: Array<{
    participant_id: string
    status: ParticipantStatus
    coach_notes?: string
    participant: {
      name: string
      email: string
    }
  }>
}

interface EventModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (eventId: string) => void
  currentUserId: string
  userRole: string
}

export default function EventModal({ 
  event, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  currentUserId, 
  userRole 
}: EventModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!event) return null

  const canEdit = userRole === 'coach' // Simplified - CalendarService handles detailed permissions
  const isOrganizer = event.organizer && currentUserId // Simplified check

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

  const getParticipantStatusLabel = (status: ParticipantStatus) => {
    const labels = {
      invited: 'Invité',
      accepted: 'Accepté',
      declined: 'Refusé',
      maybe: 'Peut-être',
      attended: 'Présent',
      absent: 'Absent'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: ParticipantStatus) => {
    const colors = {
      invited: 'text-gray-600',
      accepted: 'text-green-600',
      declined: 'text-red-600',
      maybe: 'text-yellow-600',
      attended: 'text-blue-600',
      absent: 'text-red-400'
    }
    return colors[status] || 'text-gray-600'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded-full">
                {getEventTypeLabel(event.event_type)}
              </span>
              <span>Par {event.organizer.name}</span>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit?.(event)}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                Modifier
              </button>
              {isOrganizer && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-4 mb-6">
          {/* Date and Time */}
          <div>
            <h3 className="font-medium mb-2">Date et heure</h3>
            <div className="text-gray-700">
              {event.all_day ? (
                <>
                  {format(new Date(event.start_datetime), 'EEEE d MMMM yyyy', { locale: fr })}
                  <span className="ml-2 text-sm text-gray-500">(Toute la journée)</span>
                </>
              ) : (
                <>
                  <div>
                    Début : {format(new Date(event.start_datetime), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                  </div>
                  <div>
                    Fin : {format(new Date(event.end_datetime), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div>
              <h3 className="font-medium mb-2">Lieu</h3>
              <p className="text-gray-700">{event.location}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Participants */}
          {event.participants && event.participants.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">
                Participants ({event.participants.length}
                {event.max_participants && `/${event.max_participants}`})
              </h3>
              <div className="space-y-2">
                {event.participants.map((participant) => (
                  <div key={participant.participant_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{participant.participant.name}</div>
                      <div className="text-sm text-gray-500">{participant.participant.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStatusColor(participant.status)}`}>
                        {getParticipantStatusLabel(participant.status)}
                      </div>
                      {participant.coach_notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          Note : {participant.coach_notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="border-t pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Confirmer la suppression</h4>
              <p className="text-red-700 text-sm mb-4">
                Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDelete?.(event.id)
                    setShowDeleteConfirm(false)
                    onClose()
                  }}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer définitivement
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  )
}