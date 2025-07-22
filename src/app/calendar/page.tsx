import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'
import CalendarPage from './CalendarPage'

export default async function Calendar() {
  const supabase = await createServerComponentClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Récupérer le profil utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/setup-profile')
  }

  // Récupérer la liste des athlètes pour le formulaire (si coach)
  let athletes: any[] = []
  if (profile.role === 'coach') {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'athlete')
      .eq('active', true)
      .order('name')

    athletes = data || []
  }

  return (
    <>
      <Navigation userRole={profile.role} userName={profile.name} />
      <CalendarPage 
        user={{
          id: user.id,
          role: profile.role,
          coachLevel: profile.coach_level
        }}
        athletes={athletes}
      />
    </>
  )
}