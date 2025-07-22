import webpush from 'web-push'

// Configuration VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
  vibrate?: number[]
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushNotificationService {
  /**
   * Envoie une notification push à un utilisateur spécifique
   */
  static async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        image: payload.image,
        data: {
          url: '/dashboard', // URL par défaut
          timestamp: Date.now(),
          ...payload.data
        },
        actions: payload.actions || [],
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        timestamp: payload.timestamp || Date.now(),
        vibrate: payload.vibrate || [200, 100, 200]
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify(notificationPayload),
        {
          TTL: 24 * 60 * 60, // 24 heures
          urgency: 'normal',
          topic: payload.tag
        }
      )

      console.log('✅ Notification envoyée avec succès')
      return true
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error)
      return false
    }
  }

  /**
   * Envoie des notifications en masse
   */
  static async sendBulkNotifications(
    subscriptions: PushSubscription[],
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        this.sendNotification(subscription, payload)
      )
    )

    const success = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length

    const failed = results.length - success

    return { success, failed }
  }

  /**
   * Types de notifications prédéfinies
   */
  static createTrainingReminder(minutesUntil: number, location?: string): NotificationPayload {
    return {
      title: `🥋 Entraînement dans ${minutesUntil}min`,
      body: location ? `RDV au ${location}` : 'Prépare tes affaires !',
      tag: 'training-reminder',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Voir détails' },
        { action: 'dismiss', title: 'OK' }
      ],
      data: { type: 'training', url: '/calendar' }
    }
  }

  static createMotivationMessage(streak: number): NotificationPayload {
    const messages = [
      `🔥 ${streak} jours d'affilée ! Tu es en feu !`,
      `💪 Incroyable ! ${streak} jours consécutifs`,
      `🏆 ${streak} jours de suite, tu es un champion !`
    ]
    
    return {
      title: 'Félicitations !',
      body: messages[Math.floor(Math.random() * messages.length)],
      tag: 'motivation',
      data: { type: 'motivation', streak, url: '/dashboard' }
    }
  }

  static createSocialNotification(actorName: string, action: string, target: string): NotificationPayload {
    return {
      title: '👥 Activité sociale',
      body: `${actorName} ${action} ${target}`,
      tag: 'social',
      data: { type: 'social', url: '/dashboard' }
    }
  }

  static createTaskReminder(task: string): NotificationPayload {
    return {
      title: '📝 N\'oublie pas !',
      body: task,
      tag: 'task-reminder',
      actions: [
        { action: 'complete', title: 'Marquer comme fait' },
        { action: 'snooze', title: 'Reporter 1h' }
      ],
      data: { type: 'task', url: '/notes' }
    }
  }

  static createEmergencyAlert(message: string): NotificationPayload {
    return {
      title: '⚠️ URGENT',
      body: message,
      tag: 'emergency',
      requireInteraction: true,
      vibrate: [300, 200, 300, 200, 300],
      data: { type: 'emergency', url: '/dashboard' }
    }
  }
}