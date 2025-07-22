import { requireAuth, getUserProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect, notFound } from 'next/navigation'
import Navigation from '@/components/Navigation'
import EditRecommendationForm from './EditRecommendationForm'

interface EditRecommendationPageProps {
  params: { id: string }
}

export default async function EditRecommendationPage({ params }: EditRecommendationPageProps) {
  const user = await requireAuth()
  const profile = await getUserProfile()
  
  if (!profile || profile.role !== 'coach') {
    redirect('/dashboard')
  }

  // Récupérer la recommandation à éditer avec les permissions
  let recommendationQuery = supabaseAdmin
    .from('recommendations')
    .select(`
      *,
      athlete:profiles!recommendations_athlete_id_fkey(id, name, category)
    `)
    .eq('id', params.id)
    .single()

  // Filtrer selon les permissions hiérarchiques
  if (profile.coach_level === 'super_admin') {
    // Super admin peut éditer toutes les recommandations
  } else if (profile.coach_level === 'principal') {
    // Coach principal peut éditer toutes les recommandations
  } else if (profile.coach_level === 'junior') {
    // Coach junior peut seulement éditer ses propres recommandations + celles de ses superviseurs
    const supervisorIds = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('coach_level', ['super_admin', 'principal'])
      .then(({ data }) => data?.map(p => p.id) || [])
    
    recommendationQuery = recommendationQuery.in('coach_id', [...supervisorIds, user.id])
  } else {
    // Coaches normaux peuvent seulement éditer leurs propres recommandations
    recommendationQuery = recommendationQuery.eq('coach_id', user.id)
  }

  const { data: recommendation, error } = await recommendationQuery

  if (error || !recommendation) {
    notFound()
  }

  // Récupérer tous les athlètes pour le formulaire
  const { data: athletes } = await supabaseAdmin
    .from('profiles')
    .select('id, name, category')
    .eq('role', 'athlete')
    .eq('active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Modifier la recommandation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Modifier la recommandation pour {recommendation.athlete.name}
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <EditRecommendationForm 
            recommendation={recommendation}
            athletes={athletes || []}
            coachId={user.id}
          />
        </div>
      </div>
    </div>
  )
}