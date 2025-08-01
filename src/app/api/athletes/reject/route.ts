import { createServerComponentClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    const formData = await request.formData()
    const athleteId = formData.get('athleteId') as string

    if (!athleteId) {
      return NextResponse.json({ error: 'ID athlète manquant' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est un coach actif
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: coachProfile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single()

    if (!coachProfile || coachProfile.role !== 'coach' || !coachProfile.active) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Supprimer le profil de l'athlète refusé
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', athleteId)

    if (error) {
      console.error('Erreur suppression athlète:', error)
      return NextResponse.json({ error: 'Erreur lors du refus' }, { status: 500 })
    }

    // Revalider la page
    revalidatePath('/athletes')
    
    return NextResponse.redirect(new URL('/athletes', request.url))
  } catch (error) {
    console.error('Erreur refus athlète:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}