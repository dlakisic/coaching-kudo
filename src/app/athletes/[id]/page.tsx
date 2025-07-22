import { requireAuth, getUserProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Badge } from '@/components/ui'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import RecommendationsSection from './RecommendationsSection'
import NotesSection from './NotesSection'

interface AthleteProfileProps {
  params: { id: string }
}

export default async function AthleteProfile({ params }: AthleteProfileProps) {
  const user = await requireAuth()
  const profile = await getUserProfile()
  
  if (!profile) {
    return <div>Profil introuvable</div>
  }

  // Récupérer l'athlète
  const { data: athlete, error: athleteError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'athlete')
    .single()

  if (athleteError || !athlete) {
    notFound()
  }

  // Récupérer les notes pour cet athlète (avec permissions hiérarchiques)
  let notesQuery = supabaseAdmin
    .from('notes')
    .select(`
      *,
      coach:profiles!notes_coach_id_fkey(name)
    `)
    .eq('athlete_id', params.id)
    .order('date', { ascending: false })

  // Filtrer selon les permissions
  if (profile.coach_level === 'super_admin') {
    // Super admin voit toutes les notes
  } else if (profile.coach_level === 'principal') {
    // Coach principal voit toutes les notes
  } else if (profile.coach_level === 'junior') {
    // Coach junior voit ses propres notes + celles de ses superviseurs
    const supervisorIds = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('coach_level', ['super_admin', 'principal'])
      .then(({ data }) => data?.map(p => p.id) || [])
    
    notesQuery = notesQuery.in('coach_id', [...supervisorIds, user.id])
  } else if (profile.role === 'athlete') {
    // Athlète ne voit que ses propres notes
    if (params.id !== user.id) {
      notFound()
    }
  }

  const { data: allNotes } = await notesQuery

  // Récupérer les recommandations pour cet athlète (avec permissions hiérarchiques)
  let recsQuery = supabaseAdmin
    .from('recommendations')
    .select(`
      *,
      coach:profiles!recommendations_coach_id_fkey(name)
    `)
    .eq('athlete_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Même filtrage pour les recommandations
  if (profile.coach_level === 'super_admin') {
    // Super admin voit toutes les recommandations
  } else if (profile.coach_level === 'principal') {
    // Coach principal voit toutes les recommandations
  } else if (profile.coach_level === 'junior') {
    // Coach junior voit ses propres recommandations + celles de ses superviseurs
    const supervisorIds = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('coach_level', ['super_admin', 'principal'])
      .then(({ data }) => data?.map(p => p.id) || [])
    
    recsQuery = recsQuery.in('coach_id', [...supervisorIds, user.id])
  } else if (profile.role === 'athlete') {
    // Athlète ne voit que ses propres recommandations
    if (params.id !== user.id) {
      notFound()
    }
  }

  const { data: recommendations } = await recsQuery

  const unreadRecommendations = recommendations?.filter(r => !r.read_status) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête profil athlète */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{athlete.name}</h1>
              <p className="text-gray-600">{athlete.email}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                athlete.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {athlete.active ? 'Actif' : 'En attente'}
              </span>
              <Link
                href={`/athletes/${params.id}/history`}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                📊 Historique
              </Link>
              {profile.role === 'coach' && (
                <Link
                  href={`/athletes/${params.id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  ✏️ Modifier
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Catégorie</h3>
              <p className="mt-1 text-sm text-gray-900">{athlete.category || 'Non définie'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Grade</h3>
              <p className="mt-1 text-sm text-gray-900">{athlete.grade || 'Non défini'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Poids</h3>
              <p className="mt-1 text-sm text-gray-900">{athlete.weight ? `${athlete.weight} kg` : 'Non défini'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Taille</h3>
              <p className="mt-1 text-sm text-gray-900">{athlete.height ? `${athlete.height} cm` : 'Non définie'}</p>
            </div>
          </div>
        </div>

        {/* Recommandations avec bouton intégré */}
        <div className="mb-8">
          <RecommendationsSection
            recommendations={recommendations || []}
            unreadCount={unreadRecommendations.length}
            athleteId={params.id}
            athleteName={athlete.name}
            coachId={user.id}
            isCoach={profile.role === 'coach'}
          />
        </div>

        {/* Toutes les notes avec bouton intégré */}
        <div>
          <NotesSection
            notes={allNotes || []}
            athleteId={params.id}
            athleteName={athlete.name}
            coachId={user.id}
            isCoach={profile.role === 'coach'}
          />
        </div>
      </div>
    </div>
  )
}