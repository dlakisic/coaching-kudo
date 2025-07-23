'use client'

import { useState } from 'react'

interface GoogleCalendarSyncProps {
  onSyncComplete?: () => void
}

export default function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const handleSyncAll = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/calendar/google/bidirectional-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_all'
        })
      })

      const result = await response.json()

      if (response.ok) {
        setSyncResult({
          success: true,
          message: result.message,
          details: result.details
        })
        onSyncComplete?.()
      } else {
        setSyncResult({
          success: false,
          message: result.error || 'Erreur de synchronisation'
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Erreur de connexion'
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Synchronisation Google Calendar</h3>
          <p className="text-sm text-gray-600">
            Synchroniser tous vos événements locaux avec Google Calendar
          </p>
        </div>
        
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Synchronisation...
            </div>
          ) : (
            'Synchroniser tout'
          )}
        </button>
      </div>

      {syncResult && (
        <div className={`p-3 rounded-lg border ${
          syncResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-2">
            <span className="mt-0.5">
              {syncResult.success ? '✅' : '❌'}
            </span>
            <div className="flex-1">
              <p className="font-medium">{syncResult.message}</p>
              {syncResult.details && (
                <div className="mt-2 text-sm">
                  <p>Synchronisés: {syncResult.details.synced}</p>
                  {syncResult.details.errors > 0 && (
                    <div className="mt-1">
                      <p className="text-red-600">Erreurs: {syncResult.details.errors}</p>
                      {syncResult.details.errorDetails?.map((error: string, index: number) => (
                        <p key={index} className="text-xs text-red-500 ml-2">• {error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">🔄 Synchronisation automatique</p>
        <p>
          Les événements créés ou modifiés dans Coaching Kudo sont automatiquement 
          synchronisés avec votre Google Calendar. La synchronisation inverse 
          (Google → Coaching Kudo) se fait via le bouton "Importer" du composant d'intégration.
        </p>
      </div>
    </div>
  )
}