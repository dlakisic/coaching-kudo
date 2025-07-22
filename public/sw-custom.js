// Service Worker personnalisé pour les notifications
const CACHE_NAME = 'coaching-kudo-v1'

// Gestion des notifications push
self.addEventListener('push', function(event) {
  console.log('📨 Notification push reçue:', event)

  if (!event.data) {
    return
  }

  const data = event.data.json()
  console.log('📄 Données notification:', data)

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    image: data.image,
    data: data.data,
    actions: data.actions,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    silent: data.silent,
    timestamp: data.timestamp,
    vibrate: data.vibrate
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Clic sur notification:', event)

  const notification = event.notification
  const data = notification.data || {}

  // Fermer la notification
  notification.close()

  // Gestion des actions
  if (event.action) {
    console.log('Action cliquée:', event.action)
    
    switch (event.action) {
      case 'view':
        // Ouvrir l'app à l'URL spécifiée
        event.waitUntil(
          clients.openWindow(data.url || '/dashboard')
        )
        break
      
      case 'complete':
        // Marquer une tâche comme complétée
        event.waitUntil(
          fetch('/api/notifications/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'complete',
              taskId: data.taskId,
              notificationId: data.notificationId
            })
          })
        )
        break
      
      case 'snooze':
        // Reporter la notification
        console.log('⏰ Report de 1 heure')
        break
      
      case 'dismiss':
        // Ne rien faire, juste fermer
        break
      
      default:
        // Action par défaut : ouvrir l'app
        event.waitUntil(
          clients.openWindow(data.url || '/dashboard')
        )
    }
  } else {
    // Clic simple : ouvrir l'app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        // Si une fenêtre de l'app est déjà ouverte, la focuser
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes(self.location.origin)) {
            return client.focus()
          }
        }
        
        // Sinon, ouvrir une nouvelle fenêtre
        return clients.openWindow(data.url || '/dashboard')
      })
    )
  }
})

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', function(event) {
  console.log('❌ Notification fermée:', event.notification.tag)
  
  // Analytics : tracker les notifications fermées sans interaction
  if (event.notification.data?.type) {
    fetch('/api/analytics/notification-dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: event.notification.data.type,
        tag: event.notification.tag,
        timestamp: Date.now()
      })
    }).catch(err => console.log('Erreur analytics:', err))
  }
})

// Cache des ressources importantes
self.addEventListener('fetch', function(event) {
  // Intercepter les requêtes vers les pages importantes
  if (event.request.destination === 'document') {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          return response || fetch(event.request)
        })
    )
  }
})