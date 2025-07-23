import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { GoogleCalendarService } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      // L'utilisateur a refusé l'autorisation
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/calendar?google_auth=cancelled`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/calendar?google_auth=error`
      )
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/google/callback`

    // Échanger le code contre des tokens
    const tokens = await GoogleCalendarService.exchangeCodeForTokens(
      code,
      clientId,
      clientSecret,
      redirectUri
    )

    // Sauvegarder les tokens en base de données
    const supabase = await createServerComponentClient({ cookies })
    
    const { error: dbError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      console.error('Erreur sauvegarde tokens:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/calendar?google_auth=db_error`
      )
    }

    // Rediriger vers le calendrier avec succès
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/calendar?google_auth=success`
    )

  } catch (error) {
    console.error('Erreur callback Google Calendar:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/calendar?google_auth=error`
    )
  }
}