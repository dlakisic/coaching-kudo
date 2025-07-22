import { redirect, notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'
import EventDetailsPage from './EventDetailsPage'

interface EventPageProps {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
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

  // Récupérer l'événement avec tous les détails
  const { data: event, error } = await supabase
    .from('calendar_events')
    .select(`
      *,
      organizer:profiles!calendar_events_organizer_id_fkey(name, email, coach_level),
      participants:calendar_event_participants(
        participant_id,
        status,
        coach_notes,
        responded_at,
        participant:profiles!calendar_event_participants_participant_id_fkey(name, email, category)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !event) {
    notFound()
  }

  // Vérifier les permissions de lecture
  const canRead = (
    profile.role === 'coach' || // Les coaches voient tout (RLS s'applique)
    event.visibility === 'public' ||
    event.organizer_id === user.id ||
    event.participants?.some((p: any) => p.participant_id === user.id)
  )

  if (!canRead) {
    notFound()
  }

  // Récupérer la liste des athlètes pour l'ajout de participants (si organisateur)
  let athletes: any[] = []
  if (profile.role === 'coach' && event.organizer_id === user.id) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, category')
      .eq('role', 'athlete')
      .eq('active', true)
      .order('name')

    athletes = data || []
  }

  return (
    <>
      <Navigation userRole={profile.role} userName={profile.name} />
      <EventDetailsPage 
        event={event}
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