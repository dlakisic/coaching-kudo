import { requireAuth, getUserProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default async function Recommendations({ searchParams }: { searchParams: Promise<{ athleteId?: string }> }) {
  const params = await searchParams
  const user = await requireAuth()
  const profile = await getUserProfile()
  
  if (!profile) {
    return <div>Profil introuvable</div>
  }

  // Récupérer les recommandations selon les permissions hiérarchiques
  let recommendationsQuery = supabaseAdmin
    .from('recommendations')
    .select(`
      *,
      athlete:profiles!recommendations_athlete_id_fkey (
        id,
        name,
        category
      ),
      coach:profiles!recommendations_coach_id_fkey (
        name
      )
    `)
    .order('created_at', { ascending: false })

  // Filtrer selon les permissions
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
    
    recommendationsQuery = recommendationsQuery.in('coach_id', [...supervisorIds, user.id])
  } else {
    // Athlète voit ses propres recommandations
    recommendationsQuery = recommendationsQuery.eq('athlete_id', user.id)
  }

  // Filtrer par athlète si spécifié
  if (params.athleteId) {
    recommendationsQuery = recommendationsQuery.eq('athlete_id', params.athleteId)
  }

  const { data: recommendations } = await recommendationsQuery

  // Récupérer la liste des athlètes visibles pour le filtre
  const { data: athletes } = await supabaseAdmin
    .from('profiles')
    .select('id, name, category')
    .eq('role', 'athlete')
    .eq('active', true)
    .order('name')

  const selectedAthlete = params.athleteId 
    ? athletes?.find(a => a.id === params.athleteId)
    : null

  // Statistiques
  const totalRecommendations = recommendations?.length || 0
  const unreadRecommendations = recommendations?.filter(r => !r.read_status).length || 0
  const highPriorityRecommendations = recommendations?.filter(r => r.priority === 'haute').length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedAthlete ? `Recommandations pour ${selectedAthlete.name}` : 'Recommandations'}
            </h1>
            <p className="mt-2 text-gray-600">
              {selectedAthlete 
                ? `Conseils personnalisés pour ${selectedAthlete.name}`
                : 'Gérez vos recommandations d\'entraînement'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedAthlete && (
              <Link
                href="/recommendations"
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Toutes les recommandations
              </Link>
            )}
            <Link
              href={`/recommendations/new${params.athleteId ? `?athleteId=${params.athleteId}` : ''}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Nouvelle recommandation
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        {!selectedAthlete && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">💡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRecommendations}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">🔴</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Non lues</p>
                  <p className="text-2xl font-bold text-gray-900">{unreadRecommendations}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">⚠️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Haute priorité</p>
                  <p className="text-2xl font-bold text-gray-900">{highPriorityRecommendations}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        {!selectedAthlete && athletes && athletes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filtrer par athlète</h3>
            <div className="flex flex-wrap gap-2">
              {athletes.map((athlete) => (
                <Link
                  key={athlete.id}
                  href={`/recommendations?athleteId=${athlete.id}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                >
                  {athlete.name}
                  {athlete.category && <span className="ml-1 text-xs">({athlete.category})</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Liste des recommandations */}
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {!selectedAthlete && (
                        <Link
                          href={`/athletes/${recommendation.athlete.id}`}
                          className="text-lg font-medium text-blue-600 hover:text-blue-800"
                        >
                          {recommendation.athlete.name}
                        </Link>
                      )}
                      {recommendation.coach && (
                        <span className="text-sm text-gray-500">
                          par {recommendation.coach.name}
                        </span>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          recommendation.priority === 'haute' ? 'bg-red-100 text-red-800' :
                          recommendation.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {recommendation.priority}
                        </span>
                        {!recommendation.read_status && (
                          <span className="flex items-center text-xs text-red-600">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                            Non lu
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {recommendation.title}
                    </h3>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <time>
                      {new Date(recommendation.created_at).toLocaleDateString('fr-FR')}
                    </time>
                  </div>
                </div>

                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {recommendation.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    {recommendation.read_status 
                      ? `Lu le ${new Date(recommendation.updated_at).toLocaleDateString('fr-FR')}`
                      : 'En attente de lecture'
                    }
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/recommendations/${recommendation.id}/edit`}
                      className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                    >
                      Modifier
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.84 1.318l.8.8m-1.8 2.982h1m-2.982-7.87l.8-.8M9 21h12m-7 0v9" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {selectedAthlete ? `Aucune recommandation pour ${selectedAthlete.name}` : 'Aucune recommandation'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première recommandation personnalisée.
            </p>
            <div className="mt-6">
              <Link
                href={`/recommendations/new${params.athleteId ? `?athleteId=${params.athleteId}` : ''}`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Nouvelle recommandation
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}