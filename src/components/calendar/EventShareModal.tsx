'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Modal from '@/components/ui/Modal'

interface EventShareModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string | null
}

interface CalendarLinks {
  google: string
  outlook: string
  yahoo: string
  apple: string
}

export default function EventShareModal({ isOpen, onClose, eventId }: EventShareModalProps) {
  const { isDark } = useTheme()
  const [calendarLinks, setCalendarLinks] = useState<CalendarLinks | null>(null)
  const [shareableLink, setShareableLink] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventLinks()
    }
  }, [isOpen, eventId])

  const fetchEventLinks = async () => {
    if (!eventId) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des liens')
      }

      const data = await response.json()
      setCalendarLinks(data.calendarLinks)
      setShareableLink(data.shareableLink)
    } catch (error) {
      console.error('Erreur fetch liens:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erreur copie:', error)
    }
  }

  const openCalendarLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!isOpen || !eventId) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔗 Partager l'événement">
      <div className="space-y-6">
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Génération des liens...
            </span>
          </div>
        ) : (
          <>
            {/* Liens vers services de calendrier */}
            <div>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                📅 Ajouter à votre calendrier
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => calendarLinks && openCalendarLink(calendarLinks.google)}
                  className={`flex items-center justify-center p-3 border rounded-lg hover:bg-opacity-80 transition-colors ${
                    isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mr-2">🔵</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    Google Calendar
                  </span>
                </button>

                <button
                  onClick={() => calendarLinks && openCalendarLink(calendarLinks.outlook)}
                  className={`flex items-center justify-center p-3 border rounded-lg hover:bg-opacity-80 transition-colors ${
                    isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mr-2">🟦</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    Outlook
                  </span>
                </button>

                <button
                  onClick={() => calendarLinks && openCalendarLink(calendarLinks.yahoo)}
                  className={`flex items-center justify-center p-3 border rounded-lg hover:bg-opacity-80 transition-colors ${
                    isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mr-2">🟪</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    Yahoo Calendar
                  </span>
                </button>

                <button
                  onClick={() => calendarLinks && openCalendarLink(calendarLinks.apple)}
                  className={`flex items-center justify-center p-3 border rounded-lg hover:bg-opacity-80 transition-colors ${
                    isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mr-2">🍎</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    Apple Calendar
                  </span>
                </button>
              </div>
            </div>

            {/* Lien de partage */}
            {shareableLink && (
              <div>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  🔗 Lien de partage
                </h4>
                
                <div className={`p-3 rounded-lg border ${
                  isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={shareableLink}
                      readOnly
                      className={`flex-1 px-2 py-1 text-sm rounded border-0 ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
                      }`}
                    />
                    <button
                      onClick={() => copyToClipboard(shareableLink)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        copied 
                          ? 'bg-green-600 text-white' 
                          : isDark 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {copied ? '✓ Copié' : 'Copier'}
                    </button>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Partagez ce lien pour que d'autres puissent voir les détails de l'événement
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <h5 className={`font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                💡 Comment ça marche ?
              </h5>
              <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                <li>• <strong>Calendriers</strong> : Cliquez pour ajouter directement l'événement</li>
                <li>• <strong>Lien de partage</strong> : Envoyez le lien à d'autres personnes</li>
                <li>• <strong>Les invités</strong> recevront une notification si configurée</li>
              </ul>
            </div>
          </>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
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