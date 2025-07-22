// Service Worker minimal pour le développement
console.log('📱 Service Worker DEV chargé')

// Gestion des notifications push
self.addEventListener('push', function(event) {
  console.log('📨 Notification push reçue en DEV:', event)

  if (!event.data) {
    return
  }

  const data = event.data.json()
  console.log('📄 Données notification DEV:', data)

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
    vibrate: data.vibrate || [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Clic sur notification DEV:', event)

  const notification = event.notification
  const data = notification.data || {}

  // Fermer la notification
  notification.close()

  // Ouvrir l'URL spécifiée
  const urlToOpen = data.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Si une fenêtre de l'app est déjà ouverte, la focuser
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(location.origin)) {
          return client.focus()
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      return clients.openWindow(urlToOpen)
    })
  )
})

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', function(event) {
  console.log('❌ Notification fermée DEV:', event.notification.tag)
})

// Message d'installation
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker DEV installé')
  self.skipWaiting()
})

// Message d'activation  
self.addEventListener('activate', function(event) {
  console.log('✅ Service Worker DEV activé')
  event.waitUntil(self.clients.claim())
})