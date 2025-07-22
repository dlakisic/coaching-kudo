import { requireAuth, getUserProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect, notFound } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

interface AthleteHistoryPageProps {
  params: { id: string }
}

export default async function AthleteHistoryPage({ params }: AthleteHistoryPageProps) {
  const user = await requireAuth()
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect('/setup-profile')
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

  // Récupérer toutes les notes avec permissions hiérarchiques
  let notesQuery = supabaseAdmin
    .from('notes')
    .select(`
      *,
      coach:profiles!notes_coach_id_fkey(name)
    `)
    .eq('athlete_id', params.id)
    .order('date', { ascending: false })

  // Appliquer les permissions hiérarchiques
  if (profile.role === 'athlete') {
    // Athlète ne voit que ses propres données
    if (params.id !== user.id) {
      notFound()
    }
  } else if (profile.coach_level === 'junior') {
    // Coach junior voit ses propres notes + celles de ses superviseurs
    const supervisorIds = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('coach_level', ['super_admin', 'principal'])
      .then(({ data }) => data?.map(p => p.id) || [])
    
    notesQuery = notesQuery.in('coach_id', [...supervisorIds, user.id])
  }
  // Super admin et principal voient tout par défaut

  const { data: allNotes } = await notesQuery

  // Récupérer toutes les recommandations avec permissions hiérarchiques
  let recommendationsQuery = supabaseAdmin
    .from('recommendations')
    .select(`
      *,
      coach:profiles!recommendations_coach_id_fkey(name)
    `)
    .eq('athlete_id', params.id)
    .order('created_at', { ascending: false })

  // Appliquer les mêmes permissions
  if (profile.role === 'athlete') {
    // Déjà vérifié au-dessus
  } else if (profile.coach_level === 'junior') {
    const supervisorIds = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('coach_level', ['super_admin', 'principal'])
      .then(({ data }) => data?.map(p => p.id) || [])
    
    recommendationsQuery = recommendationsQuery.in('coach_id', [...supervisorIds, user.id])
  }

  const { data: allRecommendations } = await recommendationsQuery

  // Statistiques
  const totalNotes = allNotes?.length || 0
  const totalRecommendations = allRecommendations?.length || 0
  const unreadRecommendations = allRecommendations?.filter(r => !r.read_status).length || 0

  // Statistiques par catégorie pour les notes
  const notesByCategory = allNotes?.reduce((acc, note) => {
    acc[note.category] = (acc[note.category] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const notesByContext = allNotes?.reduce((acc, note) => {
    acc[note.context] = (acc[note.context] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Recommandations par priorité
  const recommendationsByPriority = allRecommendations?.reduce((acc, rec) => {
    acc[rec.priority] = (acc[rec.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Historique complet - {athlete.name}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Toutes les notes et recommandations depuis le début
              </p>
            </div>
            <Link
              href={`/athletes/${params.id}`}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              Retour au profil
            </Link>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📝</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalNotes}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">💡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recommandations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalRecommendations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">🔔</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Non lues</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{unreadRecommendations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Entrées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalNotes + totalRecommendations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Notes par catégorie */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notes par catégorie</h3>
            <div className="space-y-2">
              {Object.entries(notesByCategory).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{category}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                </div>
              ))}
              {Object.keys(notesByCategory).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune note</p>
              )}
            </div>
          </div>

          {/* Notes par contexte */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notes par contexte</h3>
            <div className="space-y-2">
              {Object.entries(notesByContext).map(([context, count]) => (
                <div key={context} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{context}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                </div>
              ))}
              {Object.keys(notesByContext).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune note</p>
              )}
            </div>
          </div>

          {/* Recommandations par priorité */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recommandations par priorité</h3>
            <div className="space-y-2">
              {Object.entries(recommendationsByPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className={`text-sm capitalize ${
                    priority === 'haute' ? 'text-red-600 dark:text-red-400' :
                    priority === 'moyenne' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {priority === 'haute' && '🔴'} 
                    {priority === 'moyenne' && '🟡'} 
                    {priority === 'basse' && '🟢'} 
                    {priority}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                </div>
              ))}
              {Object.keys(recommendationsByPriority).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune recommandation</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Actions rapides</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/notes?athleteId=${params.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              📝 Voir toutes les notes
            </Link>
            <Link
              href={`/recommendations?athleteId=${params.id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
            >
              💡 Voir toutes les recommandations
            </Link>
            {profile.role === 'coach' && (
              <>
                <Link
                  href={`/notes/new?athleteId=${params.id}`}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  ➕ Nouvelle note
                </Link>
                <Link
                  href={`/recommendations/new?athleteId=${params.id}`}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  ➕ Nouvelle recommandation
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Timeline récente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Activité récente (10 dernières entrées)
          </h3>
          
          {/* Mélanger et trier notes + recommandations par date */}
          {(() => {
            const timeline = [
              ...(allNotes?.slice(0, 5) || []).map(note => ({
                type: 'note' as const,
                date: note.date,
                created_at: note.created_at,
                data: note
              })),
              ...(allRecommendations?.slice(0, 5) || []).map(rec => ({
                type: 'recommendation' as const,
                date: rec.created_at,
                created_at: rec.created_at,
                data: rec
              }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
             .slice(0, 10)

            return timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={`${item.type}-${item.data.id}-${index}`} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.type === 'note' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {item.type === 'note' ? '📝 Note' : '💡 Recommandation'}
                        </span>
                        {item.data.coach && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            par {item.data.coach.name}
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </time>
                    </div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {item.type === 'note' ? (
                        <>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                              {item.data.category}
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                              {item.data.context}
                            </span>
                          </div>
                          <p className="line-clamp-2">{item.data.content}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{item.data.title}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.data.priority === 'haute' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              item.data.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {item.data.priority}
                            </span>
                          </div>
                          <p className="line-clamp-2">{item.data.description}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Aucune activité enregistrée pour cet athlète
              </p>
            )
          })()}
        </div>
      </div>
    </div>
  )
}