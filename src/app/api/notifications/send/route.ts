import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserProfile } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { PushNotificationService, type NotificationPayload } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    // Authentification seulement (pas de vérification de rôle pour le test)
    const user = await requireAuth()

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'JSON invalide' },
        { status: 400 }
      )
    }

    const { 
      targetUserIds = [user.id], // Par défaut, envoyer à l'utilisateur connecté
      notificationType = 'motivation', // Type par défaut
      customPayload 
    }: {
      targetUserIds?: string[]
      notificationType?: 'training' | 'motivation' | 'social' | 'task' | 'emergency'
      customPayload?: NotificationPayload
    } = body

    if (!targetUserIds?.length && !customPayload) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = await createServerComponentClient({ cookies })

    // Récupérer les subscriptions des utilisateurs ciblés
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', targetUserIds)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur récupération subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions?.length) {
      return NextResponse.json(
        { message: 'Aucune subscription trouvée' },
        { status: 200 }
      )
    }

    // Convertir au format attendu par le service
    const pushSubscriptions = subscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    }))

    // Générer le payload selon le type ou utiliser le payload custom
    let payload: NotificationPayload

    if (customPayload) {
      payload = customPayload
    } else {
      switch (notificationType) {
        case 'training':
          payload = PushNotificationService.createTrainingReminder(60, 'Dojo principal')
          break
        case 'motivation':
          payload = PushNotificationService.createMotivationMessage(5)
          break
        case 'social':
          payload = PushNotificationService.createSocialNotification('Coach', 'a commenté', 'votre performance')
          break
        case 'task':
          payload = PushNotificationService.createTaskReminder('Noter votre séance d\'aujourd\'hui')
          break
        case 'emergency':
          payload = PushNotificationService.createEmergencyAlert('Entraînement annulé - Dojo fermé')
          break
        default:
          return NextResponse.json(
            { error: 'Type de notification invalide' },
            { status: 400 }
          )
      }
    }

    // Envoyer les notifications
    const result = await PushNotificationService.sendBulkNotifications(
      pushSubscriptions,
      payload
    )

    // Logger l'action
    await supabase
      .from('notification_logs')
      .insert({
        sender_id: user.id,
        recipient_count: targetUserIds.length,
        notification_type: notificationType || 'custom',
        payload: JSON.stringify(payload),
        success_count: result.success,
        failed_count: result.failed,
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: `${result.success} notifications envoyées, ${result.failed} échecs`,
      stats: result
    })

  } catch (error) {
    console.error('Erreur API send notification:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}