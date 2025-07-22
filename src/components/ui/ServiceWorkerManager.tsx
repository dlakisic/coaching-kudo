'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { testVapidKey } from '@/utils/vapid-test'

interface ServiceWorkerManagerProps {
  onServiceWorkerRegistered?: () => void
}

export default function ServiceWorkerManager({ onServiceWorkerRegistered }: ServiceWorkerManagerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const unregisterServiceWorker = async () => {
    setLoading(true)
    setMessage('')

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        
        for (const registration of registrations) {
          await registration.unregister()
          console.log('✅ Service Worker désenregistré:', registration.scope)
        }

        // Vider le cache
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(
            cacheNames.map(name => caches.delete(name))
          )
          console.log('✅ Caches vidés:', cacheNames)
        }

        setMessage('✅ Service Workers et caches supprimés ! Rechargez la page.')
        
        // Auto-reload après 2 secondes
        setTimeout(() => {
          window.location.reload()
        }, 2000)

      } else {
        setMessage('❌ Service Workers non supportés')
      }
    } catch (error) {
      console.error('Erreur désactivation SW:', error)
      setMessage('❌ Erreur lors de la désactivation')
    } finally {
      setLoading(false)
    }
  }

  const registerDevServiceWorker = async () => {
    setLoading(true)
    setMessage('')

    try {
      if ('serviceWorker' in navigator) {
        // Enregistrer le service worker de développement
        const registration = await navigator.serviceWorker.register('/sw-dev.js', {
          scope: '/'
        })
        
        console.log('✅ Service Worker DEV enregistré:', registration.scope)
        setMessage('✅ Service Worker de développement enregistré !')
        
        // Attendre qu'il soit prêt
        await navigator.serviceWorker.ready
        setMessage('✅ Service Worker DEV prêt pour les notifications !')
        
        // Notifier le parent que le SW est enregistré
        if (onServiceWorkerRegistered) {
          onServiceWorkerRegistered()
        }
        
      } else {
        setMessage('❌ Service Workers non supportés')
      }
    } catch (error) {
      console.error('Erreur enregistrement SW DEV:', error)
      setMessage('❌ Erreur enregistrement Service Worker')
    } finally {
      setLoading(false)
    }
  }

  const clearStorage = async () => {
    try {
      // Vider localStorage
      localStorage.clear()
      
      // Vider sessionStorage
      sessionStorage.clear()

      // Vider IndexedDB si possible
      if ('indexedDB' in window) {
        // Note: Plus complexe à implémenter complètement
        console.log('💾 Storages vidés')
      }

      setMessage('🗑️ Stockages locaux vidés !')
      
    } catch (error) {
      console.error('Erreur nettoyage storage:', error)
      setMessage('❌ Erreur nettoyage storage')
    }
  }

  const testVapid = async () => {
    setLoading(true)
    setMessage('')

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setMessage('❌ Clé VAPID manquante')
        return
      }

      const result = await testVapidKey(vapidKey)
      
      if (result.success) {
        setMessage('✅ Test VAPID réussi ! La clé fonctionne.')
      } else {
        setMessage(`❌ Test VAPID échoué: ${result.error}`)
      }

    } catch (error) {
      console.error('Erreur test VAPID:', error)
      setMessage('❌ Erreur test VAPID')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        🛠️ Outils de développement
      </h4>
      
      <div className="space-y-2">
        <button
          onClick={registerDevServiceWorker}
          disabled={loading}
          className="w-full text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳ Enregistrement...' : '🔧 SW pour notifications (DEV)'}
        </button>

        <button
          onClick={unregisterServiceWorker}
          disabled={loading}
          className="w-full text-sm px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳ Nettoyage...' : '🧹 Supprimer Service Workers'}
        </button>

        <button
          onClick={testVapid}
          disabled={loading}
          className="w-full text-sm px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳ Test...' : '🧪 Test clé VAPID'}
        </button>

        <button
          onClick={clearStorage}
          className={`w-full text-sm px-3 py-2 rounded-md transition-colors ${
            isDark 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          🗑️ Vider les storages
        </button>
      </div>

      {message && (
        <div className={`mt-3 p-2 rounded text-xs ${
          message.includes('✅') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : message.includes('❌')
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}