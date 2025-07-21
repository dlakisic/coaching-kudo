import { requireRole } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'

export default async function MyRecommendations() {
  const profile = await requireRole('athlete')
  const supabase = await createServerComponentClient()

  // Récupérer les recommandations de l'athlète avec les informations du coach
  const { data: recommendations } = await supabase
    .from('recommendations')
    .select(`
      *,
      coach:profiles!coach_id (
        id,
        name
      )
    `)
    .eq('athlete_id', profile.id)
    .order('created_at', { ascending: false })

  // Séparer les recommandations lues et non lues
  const unreadRecommendations = recommendations?.filter(r => !r.read_status) || []
  const readRecommendations = recommendations?.filter(r => r.read_status) || []

  const markAsRead = async (recommendationId: string) => {
    'use server'
    const supabase = await createServerComponentClient()
    
    await supabase
      .from('recommendations')
      .update({ 
        read_status: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', recommendationId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes recommandations</h1>
          <p className="mt-2 text-gray-600">
            Conseils personnalisés de vos coaches pour améliorer votre performance
          </p>
        </div>

        {/* Statistiques */}
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
                <p className="text-2xl font-bold text-gray-900">{recommendations?.length || 0}</p>
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
                <p className="text-sm font-medium text-gray-500">À lire</p>
                <p className="text-2xl font-bold text-gray-900">{unreadRecommendations.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lues</p>
                <p className="text-2xl font-bold text-gray-900">{readRecommendations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommandations non lues */}
        {unreadRecommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Nouvelles recommandations
              </h2>
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {unreadRecommendations.length}
              </span>
            </div>

            <div className="space-y-4">
              {unreadRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          recommendation.priority === 'haute' ? 'bg-red-100 text-red-800' :
                          recommendation.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {recommendation.priority}
                        </span>
                        <span className="flex items-center text-xs text-red-600">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                          Nouveau
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {recommendation.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Par {recommendation.coach.name}
                      </p>
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

                  <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <form action={markAsRead.bind(null, recommendation.id)}>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Marquer comme lu
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommandations lues */}
        {readRecommendations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recommandations précédentes
            </h2>

            <div className="space-y-4">
              {readRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-75">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          recommendation.priority === 'haute' ? 'bg-red-100 text-red-800' :
                          recommendation.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {recommendation.priority}
                        </span>
                        <span className="flex items-center text-xs text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Lu
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {recommendation.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Par {recommendation.coach.name}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <time>
                        {new Date(recommendation.created_at).toLocaleDateString('fr-FR')}
                      </time>
                      <p className="text-xs">
                        Lu le {new Date(recommendation.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* État vide */}
        {(!recommendations || recommendations.length === 0) && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.84 1.318l.8.8m-1.8 2.982h1m-2.982-7.87l.8-.8M9 21h12m-7 0v9" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucune recommandation
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Vos coaches n'ont pas encore créé de recommandations pour vous.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}