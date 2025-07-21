import { createServerComponentClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    const formData = await request.formData()
    
    const athleteId = formData.get('athleteId') as string
    const level = formData.get('level') as 'principal' | 'junior'

    if (!athleteId || !level) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier les permissions du créateur
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('role, coach_level, is_super_admin')
      .eq('id', user.id)
      .single()

    if (!creatorProfile || creatorProfile.role !== 'coach') {
      return NextResponse.json({ error: 'Seuls les coaches peuvent promouvoir' }, { status: 403 })
    }

    // Vérifier les permissions selon le niveau
    const isSuper = creatorProfile.coach_level === 'super_admin' || creatorProfile.is_super_admin
    const canCreatePrincipal = isSuper
    const canCreateJunior = isSuper || creatorProfile.coach_level === 'principal'

    if (level === 'principal' && !canCreatePrincipal) {
      return NextResponse.json({ error: 'Permissions insuffisantes pour créer un coach principal' }, { status: 403 })
    }

    if (level === 'junior' && !canCreateJunior) {
      return NextResponse.json({ error: 'Permissions insuffisantes pour créer un coach junior' }, { status: 403 })
    }

    // Utiliser la fonction Postgres pour créer le coach
    const { error } = await supabase.rpc('create_junior_coach', {
      p_athlete_id: athleteId,
      p_coach_level: level,
      p_created_by: user.id
    })

    if (error) {
      console.error('Erreur promotion coach:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Revalider les pages
    revalidatePath('/admin/coaches')
    revalidatePath('/athletes')
    
    return NextResponse.redirect(new URL('/admin/coaches', request.url))
  } catch (error) {
    console.error('Erreur promotion coach:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}