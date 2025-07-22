'use client'

import { useState, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import PushNotificationManager, { type PushNotificationManagerRef } from '@/components/notifications/PushNotificationManager'
import NotificationPreferences from '@/components/notifications/NotificationPreferences'
import ServiceWorkerManager from '@/components/ui/ServiceWorkerManager'
import { createClientComponentClient } from '@/lib/supabase'

interface NotificationsTestClientProps {
  userRole: 'coach' | 'athlete'
}

export default function NotificationsTestClient({ userRole }: NotificationsTestClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClientComponentClient()
  const [sendingTest, setSendingTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const pushManagerRef = useRef<PushNotificationManagerRef>(null)

  const addTestResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()} - ${message}`, ...prev.slice(0, 9)])
  }

  const handleServiceWorkerRegistered = () => {
    addTestResult('🔧 Service Worker enregistré - Vérification du support...')
    // Déclencher la re-vérification du support dans PushNotificationManager
    setTimeout(() => {
      if (pushManagerRef.current?.recheckSupport) {
        pushManagerRef.current.recheckSupport()
        addTestResult('🔄 Support des notifications re-vérifié')
      }
    }, 1000)
  }

  const sendTestNotification = async (type: string) => {
    setSendingTest(type)
    addTestResult(`🔄 Envoi notification "${type}"...`)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserIds: [user.id],
          notificationType: type
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur serveur')
      }

      const result = await response.json()
      addTestResult(`✅ Notification "${type}" envoyée avec succès`)
      addTestResult(`📊 Stats: ${result.stats?.success || 0} succès, ${result.stats?.failed || 0} échecs`)

    } catch (error) {
      addTestResult(`❌ Erreur "${type}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSendingTest(null)
    }
  }

  const sendCustomNotification = async () => {
    setSendingTest('custom')
    addTestResult('🔄 Envoi notification personnalisée...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserIds: [user.id],
          customPayload: {
            title: '🧪 Test Coaching Kudo',
            body: 'Ceci est une notification de test personnalisée !',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: 'test-custom',
            data: { 
              type: 'test', 
              url: '/notifications-test',
              timestamp: Date.now()
            },
            actions: [
              { action: 'view', title: 'Voir' },
              { action: 'dismiss', title: 'OK' }
            ],
            vibrate: [200, 100, 200],
            requireInteraction: false
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur serveur')
      }

      const result = await response.json()
      addTestResult('✅ Notification personnalisée envoyée')
      addTestResult(`📊 Stats: ${result.stats?.success || 0} succès, ${result.stats?.failed || 0} échecs`)

    } catch (error) {
      addTestResult(`❌ Erreur personnalisée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setSendingTest(null)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            🧪 Test des Notifications Push
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Interface de test pour valider le système de notifications
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Colonne gauche : Gestion et préférences */}
          <div className="space-y-6">
            
            {/* Push Notification Manager */}
            <PushNotificationManager />
            
            {/* Test Notifications (Coach only) */}
            {userRole === 'coach' && (
              <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  🎯 Tests d'envoi (Coach)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {[
                    { type: 'training', label: '🥋 Entraînement', desc: 'Rappel d\'entraînement' },
                    { type: 'motivation', label: '💪 Motivation', desc: 'Message motivationnel' },
                    { type: 'social', label: '👥 Social', desc: 'Notification sociale' },
                    { type: 'task', label: '📝 Tâche', desc: 'Rappel de tâche' },
                    { type: 'emergency', label: '⚠️ Urgence', desc: 'Alerte urgente' }
                  ].map(({ type, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => sendTestNotification(type)}
                      disabled={!!sendingTest}
                      className={`p-3 text-left rounded-lg border transition-colors text-sm disabled:opacity-50 ${
                        sendingTest === type 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : isDark 
                            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' 
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {sendingTest === type ? '⏳' : ''} {label}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {desc}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={sendCustomNotification}
                  disabled={!!sendingTest}
                  className={`w-full p-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    sendingTest === 'custom'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {sendingTest === 'custom' ? '⏳ Envoi...' : '🎨 Test Personnalisé'}
                </button>
              </div>
            )}
          </div>

          {/* Colonne droite : Préférences et résultats */}
          <div className="space-y-6">
            
            {/* Notification Preferences */}
            <NotificationPreferences />
            
            {/* Test Results */}
            <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  📊 Résultats des tests
                </h3>
                <button
                  onClick={clearResults}
                  disabled={testResults.length === 0}
                  className={`text-sm px-3 py-1 rounded-md transition-colors disabled:opacity-50 ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🗑️ Effacer
                </button>
              </div>

              <div className={`max-h-64 overflow-y-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {testResults.length === 0 ? (
                  <p className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aucun test effectué pour le moment
                  </p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div 
                        key={index} 
                        className={`text-xs p-2 rounded font-mono ${
                          isDark ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Service Worker Manager */}
            <ServiceWorkerManager />

            {/* Instructions */}
            <div className={`rounded-lg border p-6 ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                📖 Instructions de test
              </h4>
              <ol className={`text-xs space-y-1 list-decimal list-inside ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                <li>Si problème de cache : utilisez "Supprimer Service Workers" ci-dessus</li>
                <li>Activez d'abord les notifications avec le bouton "Activer"</li>
                <li>Accordez la permission quand le navigateur le demande</li>
                <li>Une fois abonné, testez l'envoi avec les boutons ci-dessus</li>
                <li>Les notifications apparaîtront en haut à droite</li>
                <li>Cliquez dessus pour voir les actions disponibles</li>
                <li>Ajustez vos préférences et retestez</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}