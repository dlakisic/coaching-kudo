'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface SyncHistory {
  id: string
  imported_count: number
  updated_count: number
  error_count: number
  errors?: string[]
  synced_at: string
}

interface GoogleCalendarStatus {
  isConnected: boolean
  lastConnection?: string
  syncHistory: SyncHistory[]
}

export default function GoogleCalendarIntegration() {
  const { isDark } = useTheme()
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    isConnected: false,
    syncHistory: []
  })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/calendar/google/sync')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Erreur récupération statut Google Calendar:', error)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/google/auth?action=connect')
      if (response.ok) {
        const data = await response.json()
        // Ouvrir l'URL d'autorisation dans une nouvelle fenêtre
        window.open(data.authUrl, 'google-auth', 'width=500,height=600')
        
        // Écouter les messages de la fenêtre popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener)
            fetchStatus() // Rafraîchir le statut
          }
        }
        
        window.addEventListener('message', messageListener)
      }
    } catch (error) {
      console.error('Erreur connexion Google Calendar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`✅ Synchronisation réussie!\n${data.message}`)
        fetchStatus() // Rafraîchir l'historique
      } else if (data.needsAuth) {
        alert('❌ Autorisation expirée. Veuillez vous reconnecter à Google Calendar.')
        setStatus(prev => ({ ...prev, isConnected: false }))
      } else {
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error)
      alert('❌ Erreur lors de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`rounded-lg border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📅</div>
          <div>
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Google Calendar
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Synchronisez vos événements Google Calendar
            </p>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          status.isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {status.isConnected ? '✅ Connecté' : '❌ Déconnecté'}
        </div>
      </div>

      {!status.isConnected ? (
        <div className="space-y-3">
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Connectez votre compte Google pour importer automatiquement vos événements Google Calendar.
          </p>
          
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Connexion...</span>
              </>
            ) : (
              <>
                <span>🔗</span>
                <span>Connecter Google Calendar</span>
              </>
            )}
          </button>

          <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
            <strong>💡 Ce qui sera synchronisé :</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Événements des 30 derniers jours et 90 prochains jours</li>
              <li>Titre, description, date/heure et lieu</li>
              <li>Mise à jour automatique des événements modifiés</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex space-x-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Synchronisation...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Synchroniser maintenant</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setStatus(prev => ({ ...prev, isConnected: false }))}
              className={`px-4 py-2 border rounded-md transition-colors ${
                isDark 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Déconnecter"
            >
              🔌
            </button>
          </div>

          {/* Historique des synchronisations */}
          {status.syncHistory.length > 0 && (
            <div>
              <h4 className={`font-medium mb-2 text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                📊 Historique des synchronisations
              </h4>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {status.syncHistory.slice(0, 5).map((sync) => (
                  <div
                    key={sync.id}
                    className={`p-2 rounded text-xs ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {formatDate(sync.synced_at)}
                      </span>
                      {sync.error_count > 0 && (
                        <span className="text-red-500 text-xs">
                          ⚠️ {sync.error_count} erreurs
                        </span>
                      )}
                    </div>
                    
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {sync.imported_count} importés, {sync.updated_count} mis à jour
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`p-3 rounded-lg text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
            <strong>ℹ️ Informations :</strong> Les événements Google Calendar apparaîtront avec un indicateur spécial. 
            Ils ne peuvent être modifiés que depuis Google Calendar.
          </div>
        </div>
      )}
    </div>
  )
}