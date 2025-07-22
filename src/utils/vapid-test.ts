// Utilitaire pour tester les clés VAPID
export async function testVapidKey(publicKey: string): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'Service Workers non supportés' }
    }

    if (!('PushManager' in window)) {
      return { success: false, error: 'Push API non supporté' }
    }

    // Fonction de conversion
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

    const registration = await navigator.serviceWorker.ready
    const applicationServerKey = urlBase64ToUint8Array(publicKey)

    // Test de création d'abonnement
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })

    // Nettoyage immédiat
    await subscription.unsubscribe()

    return { 
      success: true, 
      details: {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        keyLength: applicationServerKey.length
      }
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: { errorType: error?.constructor?.name }
    }
  }
}