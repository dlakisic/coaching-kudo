'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Modal from '@/components/ui/Modal'

interface CalendarExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CalendarExportModal({ isOpen, onClose }: CalendarExportModalProps) {
  const { isDark } = useTheme()
  const [exportRange, setExportRange] = useState('3months')
  const [exportType, setExportType] = useState('all')
  const [loading, setLoading] = useState(false)

  const handleExport = async (format: 'ical' | 'json') => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        format,
        range: exportRange,
        type: exportType
      })

      const response = await fetch(`/api/calendar/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export')
      }

      if (format === 'ical') {
        // Télécharger le fichier
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `coaching-kudo-${exportRange}.ics`
        link.click()
        URL.revokeObjectURL(url)
      } else {
        // Afficher le JSON (pour debug)
        const data = await response.json()
        console.log('Export JSON:', data)
      }

      onClose()
    } catch (error) {
      console.error('Erreur export:', error)
      alert('Erreur lors de l\'export du calendrier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📤 Exporter le calendrier">
      <div className="space-y-6">
        
        {/* Période d'export */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Période à exporter
          </label>
          <select
            value={exportRange}
            onChange={(e) => setExportRange(e.target.value)}
            className={`w-full p-2 border rounded-md ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="1month">1 mois (actuel)</option>
            <option value="3months">3 mois</option>
            <option value="6months">6 mois</option>
            <option value="1year">1 an</option>
            <option value="all">Tous les événements</option>
          </select>
        </div>

        {/* Type d'événements */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Type d'événements
          </label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className={`w-full p-2 border rounded-md ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Tous les types</option>
            <option value="training">Entraînements</option>
            <option value="competition">Compétitions</option>
            <option value="meeting">Réunions</option>
            <option value="seminar">Stages</option>
            <option value="other">Autres</option>
          </select>
        </div>

        {/* Formats d'export */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Format d'export
          </h4>
          
          <div className="space-y-3">
            <button
              onClick={() => handleExport('ical')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                borderColor: isDark ? '#374151' : '#d1d5db'
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📅</span>
                <div className="text-left">
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Fichier iCal (.ics)
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Compatible avec Apple Calendar, Google Calendar, Outlook
                  </div>
                </div>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Télécharger
              </span>
            </button>

            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
              <h5 className={`font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                🔗 Liens rapides
              </h5>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                Pour ajouter un événement spécifique à votre calendrier personnel :
              </p>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-blue-600'}`}>
                • Cliquez sur un événement du calendrier<br/>
                • Utilisez les boutons &quot;Ajouter à Google Calendar&quot;, &quot;Outlook&quot;, etc.<br/>
                • L'événement sera ajouté directement à votre calendrier
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDark 
                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  )
}