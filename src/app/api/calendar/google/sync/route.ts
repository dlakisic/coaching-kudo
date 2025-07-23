import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { GoogleCalendarService } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient({ cookies })

    // Récupérer les tokens Google de l'utilisateur
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ 
        error: 'Aucune autorisation Google Calendar trouvée',
        needsAuth: true 
      }, { status: 401 })
    }

    // Vérifier si le token a expiré et le rafraîchir si nécessaire
    let accessToken = tokenData.access_token
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    if (expiresAt <= now && tokenData.refresh_token) {
      try {
        const newTokens = await GoogleCalendarService.refreshAccessToken(
          tokenData.refresh_token,
          process.env.GOOGLE_CLIENT_ID!,
          process.env.GOOGLE_CLIENT_SECRET!
        )

        accessToken = newTokens.access_token

        // Mettre à jour les tokens en base
        await supabase
          .from('google_calendar_tokens')
          .update({
            access_token: newTokens.access_token,
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

      } catch (refreshError) {
        console.error('Erreur refresh token:', refreshError)
        return NextResponse.json({ 
          error: 'Token expiré - Réautorisation nécessaire',
          needsAuth: true 
        }, { status: 401 })
      }
    }

    // Synchroniser les événements
    const syncResult = await GoogleCalendarService.syncWithDatabase(
      user.id,
      accessToken,
      supabase
    )

    // Enregistrer le résultat de la synchronisation
    await supabase
      .from('google_calendar_syncs')
      .insert({
        user_id: user.id,
        imported_count: syncResult.imported,
        updated_count: syncResult.updated,
        error_count: syncResult.errors.length,
        errors: syncResult.errors.length > 0 ? JSON.stringify(syncResult.errors) : null,
        synced_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${syncResult.imported} importés, ${syncResult.updated} mis à jour`,
      details: syncResult
    })

  } catch (error) {
    console.error('Erreur synchronisation Google Calendar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createServerComponentClient({ cookies })

    // Récupérer l'historique des synchronisations
    const { data: syncHistory, error } = await supabase
      .from('google_calendar_syncs')
      .select('*')
      .eq('user_id', user.id)
      .order('synced_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: 'Erreur récupération historique' }, { status: 500 })
    }

    // Vérifier le statut de la connexion Google
    const { data: tokenData } = await supabase
      .from('google_calendar_tokens')
      .select('expires_at, created_at')
      .eq('user_id', user.id)
      .single()

    const isConnected = tokenData && new Date(tokenData.expires_at) > new Date()

    return NextResponse.json({
      isConnected,
      lastConnection: tokenData?.created_at,
      syncHistory
    })

  } catch (error) {
    console.error('Erreur statut Google Calendar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}