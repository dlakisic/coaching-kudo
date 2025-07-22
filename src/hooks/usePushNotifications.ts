'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase'

export type NotificationPermission = 'default' | 'granted' | 'denied'

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission
  subscription: PushSubscription | null
  isSubscribed: boolean
  loading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    subscription: null,
    isSubscribed: false,
    loading: true,
    error: null
  })

  const supabase = createClientComponentClient()

  // Fonction pour vérifier le support
  const checkSupport = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Vérifications de base
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers non supportés')
      }

      if (!('Notification' in window)) {
        throw new Error('Notifications non supportées')
      }

      if (!('PushManager' in window)) {
        throw new Error('Push API non supporté')
      }

      // Vérifier s'il y a un service worker enregistré
      const registrations = await navigator.serviceWorker.getRegistrations()
      
      if (registrations.length === 0) {
        // Pas de service worker - on considère comme non supporté pour l'instant
        setState(prev => ({
          ...prev,
          isSupported: false,
          loading: false,
          error: 'Aucun Service Worker enregistré - Utilisez le bouton "SW pour notifications" ci-dessous'
        }))
        return
      }

      // Attendre que le service worker soit prêt
      const registration = await navigator.serviceWorker.ready
      
      // Vérifier la subscription existante
      const subscription = await registration.pushManager.getSubscription()
      
      setState(prev => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
        subscription,
        isSubscribed: !!subscription,
        loading: false
      }))


    } catch (error) {
      console.error('❌ Erreur vérification push:', error)
      setState(prev => ({
        ...prev,
        isSupported: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }))
    }
  }, [])

  // Vérifier le support au montage
  useEffect(() => {
    checkSupport()
  }, [checkSupport])

  // Fonction pour forcer la re-vérification (appelable depuis l'extérieur)
  const recheckSupport = useCallback(() => {
    checkSupport()
  }, [checkSupport])

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications non supportées' }))
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setState(prev => ({ ...prev, permission }))
      
      if (permission === 'granted') {
        console.log('✅ Permission accordée')
        return true
      } else {
        console.log('❌ Permission refusée')
        return false
      }
    } catch (error) {
      console.error('Erreur demande permission:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erreur lors de la demande de permission' 
      }))
      return false
    }
  }, [state.isSupported])

  // S'abonner aux notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      const hasPermission = await requestPermission()
      if (!hasPermission) return false
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Convertir la clé VAPID en Uint8Array
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        throw new Error('Clé VAPID manquante')
      }

      // Fonction pour convertir base64 URL-safe vers Uint8Array
      function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey)
      
      // Créer une nouvelle subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      })

      // Conversion sécurisée des clés
      const p256dhKey = subscription.getKey('p256dh')
      const authKey = subscription.getKey('auth')
      
      if (!p256dhKey || !authKey) {
        throw new Error('Clés de subscription manquantes')
      }

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
        }
      }

      // Envoyer la subscription au serveur
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: subscriptionData })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur serveur: ${response.status}`)
      }

      const result = await response.json()

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: true,
        loading: false
      }))

      return true

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur abonnement'
      }))
      return false
    }
  }, [state.isSupported, state.permission, requestPermission])

  // Se désabonner
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) return true

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Annuler la subscription côté client
      const success = await state.subscription.unsubscribe()
      
      if (success) {
        // Supprimer du serveur
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: state.subscription.endpoint
          })
        })

        setState(prev => ({
          ...prev,
          subscription: null,
          isSubscribed: false,
          loading: false
        }))

        console.log('✅ Désabonnement réussi')
        return true
      }

      throw new Error('Échec du désabonnement')

    } catch (error) {
      console.error('❌ Erreur désabonnement:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur désabonnement'
      }))
      return false
    }
  }, [state.subscription])

  // Envoyer une notification de test
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!state.isSubscribed) {
      setState(prev => ({ ...prev, error: 'Pas d\'abonnement actif' }))
      return false
    }

    try {
      // Récupérer l'ID utilisateur depuis Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserIds: [user.id],
          notificationType: 'motivation'
        })
      })

      if (!response.ok) {
        throw new Error('Erreur envoi notification test')
      }

      return true

    } catch (error) {
      console.error('❌ Erreur notification test:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur test'
      }))
      return false
    }
  }, [state.isSubscribed, supabase])

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    recheckSupport
  }
}