'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useTheme } from '@/contexts/ThemeContext'

export interface PushNotificationManagerRef {
  recheckSupport: () => void
}

const PushNotificationManager = forwardRef<PushNotificationManagerRef>((props, ref) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [showDetails, setShowDetails] = useState(false)

  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    recheckSupport
  } = usePushNotifications()

  // Exposer recheckSupport via ref
  useImperativeHandle(ref, () => ({
    recheckSupport
  }))

  const getStatusColor = () => {
    if (!isSupported) return 'gray'
    if (permission === 'denied') return 'red'
    if (isSubscribed) return 'green'
    return 'yellow'
  }

  const getStatusText = () => {
    if (!isSupported) return 'Non supporté'
    if (permission === 'denied') return 'Bloquées'
    if (isSubscribed) return 'Activées'
    if (permission === 'granted') return 'Autorisées'
    return 'En attente'
  }

  const getStatusIcon = () => {
    const color = getStatusColor()
    if (color === 'green') return '🔔'
    if (color === 'yellow') return '🔕'
    if (color === 'red') return '❌'
    return '❓'
  }

  return (
    <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Notifications Push
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Statut : <span className={`font-medium text-${getStatusColor()}-600`}>
                {getStatusText()}
              </span>
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            isDark 
              ? 'text-gray-300 hover:bg-gray-700' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {showDetails ? 'Masquer' : 'Détails'}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {!isSupported && (
          <div className={`text-sm p-3 rounded-md ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            🚫 Votre navigateur ne supporte pas les notifications push
          </div>
        )}

        {isSupported && permission === 'default' && (
          <button
            onClick={requestPermission}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '⏳' : '🔔'} Activer les notifications
          </button>
        )}

        {isSupported && permission === 'granted' && !isSubscribed && (
          <button
            onClick={subscribe}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '⏳' : '✅'} S'abonner
          </button>
        )}

        {isSubscribed && (
          <>
            <button
              onClick={unsubscribe}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '⏳' : '🚫'} Se désabonner
            </button>
            
            <button
              onClick={sendTestNotification}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50 ${
                isDark 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {loading ? '⏳' : '🧪'} Test
            </button>
          </>
        )}

        {permission === 'denied' && (
          <div className={`text-sm p-3 rounded-md ${isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
            ❌ Notifications bloquées. Allez dans les paramètres de votre navigateur pour les réactiver.
          </div>
        )}
      </div>

      {/* Detailed information */}
      {showDetails && (
        <div className={`text-xs space-y-2 p-3 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="grid grid-cols-2 gap-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Support :</span>
            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
              {isSupported ? '✅ Oui' : '❌ Non'}
            </span>
            
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permission :</span>
            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
              {permission === 'granted' ? '✅ Accordée' : 
               permission === 'denied' ? '❌ Refusée' : '⏳ En attente'}
            </span>
            
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Abonnement :</span>
            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
              {isSubscribed ? '✅ Actif' : '❌ Inactif'}
            </span>
          </div>

          {isSupported && (
            <div className="mt-3 pt-2 border-t border-gray-300 dark:border-gray-600">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                💡 <strong>Conseil :</strong> Activez les notifications pour recevoir des rappels d'entraînement, 
                des encouragements et des alertes importantes du club.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Benefits section when not subscribed */}
      {isSupported && !isSubscribed && (
        <div className={`mt-4 p-3 rounded-md ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
          <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
            🌟 Pourquoi activer les notifications ?
          </h4>
          <ul className={`text-xs space-y-1 ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
            <li>🥋 Rappels d'entraînement personnalisés</li>
            <li>🏆 Messages de motivation et félicitations</li>
            <li>👥 Notifications sociales du club</li>
            <li>⚠️ Alertes importantes (annulations, changements)</li>
            <li>📝 Rappels pour noter vos séances</li>
          </ul>
        </div>
      )}
    </div>
  )
})

PushNotificationManager.displayName = 'PushNotificationManager'

export default PushNotificationManager