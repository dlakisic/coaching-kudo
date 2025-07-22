'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Modal from '@/components/ui/Modal'
import { eventFormSchema, type EventFormInput } from '@/schemas'
import { EVENT_TYPES, EVENT_VISIBILITY, type EventType, type EventVisibility } from '@/constants'

interface AthleteOption {
  id: string
  name: string
  email: string
}

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EventFormInput) => void
  athletes: AthleteOption[]
  initialDate?: Date
  initialData?: Partial<EventFormInput>
  isLoading?: boolean
}

export default function EventForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  athletes, 
  initialDate,
  initialData,
  isLoading = false 
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormInput>({
    title: '',
    description: '',
    eventType: 'training' as EventType,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    location: '',
    maxParticipants: '',
    visibility: 'public' as EventVisibility,
    participants: []
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form with provided data
  useEffect(() => {
    if (initialDate) {
      const dateStr = format(initialDate, 'yyyy-MM-dd')
      setFormData(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
        startTime: '10:00',
        endTime: '11:00'
      }))
    }

    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialDate, initialData])

  const validateForm = () => {
    try {
      eventFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: Record<string, string> = {}
      if (error.errors) {
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message
        })
      }
      setErrors(newErrors)
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof EventFormInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

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

  const getVisibilityLabel = (visibility: EventVisibility) => {
    const labels = {
      public: 'Public (visible par tous)',
      private: 'Privé (visible par vous seul)',
      coaches_only: 'Coaches uniquement'
    }
    return labels[visibility]
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">
          {initialData ? 'Modifier l\'événement' : 'Nouvel événement'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Entraînement technique"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description de l'événement..."
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Type d'événement *
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => handleInputChange('eventType', e.target.value as EventType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getEventTypeLabel(type)}
                </option>
              ))}
            </select>
            {errors.eventType && (
              <p className="text-red-500 text-sm mt-1">{errors.eventType}</p>
            )}
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => handleInputChange('allDay', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="text-sm font-medium">
              Toute la journée
            </label>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Date de début *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {!formData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Heure de début *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Heure de fin *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Lieu
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Dojo principal"
            />
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre maximum de participants
            </label>
            <input
              type="number"
              value={formData.maxParticipants || ''}
              onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Laissez vide pour illimité"
            />
            {errors.maxParticipants && (
              <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Visibilité
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => handleInputChange('visibility', e.target.value as EventVisibility)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {EVENT_VISIBILITY.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {getVisibilityLabel(visibility)}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Enregistrement...' : (initialData ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}