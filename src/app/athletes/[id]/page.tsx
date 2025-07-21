import { requireRole } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface AthleteProfileProps {
  params: { id: string }
}

export default async function AthleteProfile({ params }: AthleteProfileProps) {
  const profile = await requireRole('coach')
  const supabase = await createServerComponentClient()

  // Récupérer l'athlète
  const { data: athlete } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'athlete')
    .single()

  if (!athlete) {
    notFound()
  }

  // Récupérer les notes récentes de cet athlète
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('*')
    .eq('athlete_id', params.id)
    .eq('coach_id', profile.id)
    .order('date', { ascending: false })
    .limit(5)

  // Récupérer les recommandations actives
  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('*')
    .eq('athlete_id', params.id)
    .eq('coach_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

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
                href={`/athletes/${params.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Modifier
              </Link>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <Link
                href={`/notes/new?athleteId=${params.id}`}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 flex items-center justify-center"
              >
                📝 Ajouter une note
              </Link>
              <Link
                href={`/recommendations/new?athleteId=${params.id}`}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-md font-medium hover:bg-green-700 flex items-center justify-center"
              >
                💡 Créer une recommandation
              </Link>
              <Link
                href={`/athletes/${params.id}/history`}
                className="w-full bg-gray-600 text-white px-4 py-3 rounded-md font-medium hover:bg-gray-700 flex items-center justify-center"
              >
                📊 Voir l'historique complet
              </Link>
            </div>
          </div>

          {/* Recommandations non lues */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recommandations</h2>
              {unreadRecommendations.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {unreadRecommendations.length} non lues
                </span>
              )}
            </div>
            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((recommendation) => (
                  <div key={recommendation.id} className={`p-3 rounded-md border ${
                    !recommendation.read_status ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{recommendation.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          recommendation.priority === 'haute' ? 'bg-red-100 text-red-800' :
                          recommendation.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {recommendation.priority}
                        </span>
                        {!recommendation.read_status && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{recommendation.description}</p>
                  </div>
                ))}
                {recommendations.length > 3 && (
                  <Link
                    href={`/recommendations?athleteId=${params.id}`}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    Voir toutes les recommandations ({recommendations.length})
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune recommandation pour cet athlète</p>
            )}
          </div>
        </div>

        {/* Notes récentes */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Notes récentes</h2>
            <Link
              href={`/notes?athleteId=${params.id}`}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              Voir toutes les notes
            </Link>
          </div>
          {recentNotes && recentNotes.length > 0 ? (
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <div key={note.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        note.category === 'technique' ? 'bg-blue-100 text-blue-800' :
                        note.category === 'mental' ? 'bg-purple-100 text-purple-800' :
                        note.category === 'physique' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {note.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        note.context === 'competition' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {note.context}
                      </span>
                    </div>
                    <time className="text-xs text-gray-500">
                      {new Date(note.date).toLocaleDateString('fr-FR')}
                    </time>
                  </div>
                  <p className="text-sm text-gray-900">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune note pour cet athlète</p>
          )}
        </div>
      </div>
    </div>
  )
}