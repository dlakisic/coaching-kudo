import { requireRole } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default async function CoachesAdmin() {
  const profile = await requireRole('coach')
  const supabase = await createServerComponentClient()

  // Vérifier que l'utilisateur a les permissions d'admin
  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('coach_level, is_super_admin')
    .eq('id', profile.id)
    .single()

  if (!adminCheck?.is_super_admin && adminCheck?.coach_level !== 'super_admin' && adminCheck?.coach_level !== 'principal') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation userRole={profile.role} userName={profile.name} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accès non autorisé</h3>
            <p className="text-gray-500">Vous n'avez pas les permissions pour gérer les coaches.</p>
          </div>
        </div>
      </div>
    )
  }

  // Récupérer la hiérarchie des coaches
  const { data: coaches } = await supabase
    .from('coach_hierarchy_view')
    .select('*')
    .order('depth', { ascending: true })

  // Récupérer les athlètes éligibles pour devenir coaches
  const { data: eligibleAthletes } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'athlete')
    .eq('active', true)
    .order('name')

  // Récupérer les coaches gérés par l'utilisateur actuel
  const { data: managedCoaches } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'coach')
    .eq('managed_by', profile.id)
    .order('name')

  const isSuper = adminCheck?.coach_level === 'super_admin' || adminCheck?.is_super_admin
  const canCreatePrincipal = isSuper
  const canCreateJunior = isSuper || adminCheck?.coach_level === 'principal'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Coaches</h1>
          <p className="mt-2 text-gray-600">
            Gérez la hiérarchie et les permissions des coaches
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">👑</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Coaches</p>
                <p className="text-2xl font-bold text-gray-900">{coaches?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sous ma gestion</p>
                <p className="text-2xl font-bold text-gray-900">{managedCoaches?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Éligibles</p>
                <p className="text-2xl font-bold text-gray-900">{eligibleAthletes?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Hiérarchie des coaches */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Hiérarchie des Coaches</h2>
            </div>
            
            {coaches && coaches.length > 0 ? (
              <div className="space-y-3">
                {coaches.map((coach) => (
                  <div 
                    key={coach.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      coach.id === profile.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                    style={{ marginLeft: `${coach.depth * 20}px` }}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      coach.coach_level === 'super_admin' ? 'bg-red-500' :
                      coach.coach_level === 'principal' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{coach.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          coach.coach_level === 'super_admin' ? 'bg-red-100 text-red-800' :
                          coach.coach_level === 'principal' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {coach.coach_level}
                        </span>
                        {coach.id === profile.id && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                            Vous
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune hiérarchie trouvée</p>
            )}
          </div>

          {/* Promouvoir des athlètes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Promouvoir en Coach</h2>
            </div>

            {/* Permissions actuelles */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Vos permissions :</h3>
              <div className="space-y-1">
                {canCreatePrincipal && (
                  <div className="flex items-center text-sm text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Créer des coaches principaux
                  </div>
                )}
                {canCreateJunior && (
                  <div className="flex items-center text-sm text-blue-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Créer des coaches juniors
                  </div>
                )}
                {!canCreateJunior && !canCreatePrincipal && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    Aucune permission de création
                  </div>
                )}
              </div>
            </div>

            {eligibleAthletes && eligibleAthletes.length > 0 && (canCreateJunior || canCreatePrincipal) ? (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {eligibleAthletes.slice(0, 10).map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{athlete.name}</h3>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          {athlete.category && <span>{athlete.category}</span>}
                          {athlete.grade && <span>• {athlete.grade}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canCreateJunior && (
                          <form action="/api/admin/promote-coach" method="POST">
                            <input type="hidden" name="athleteId" value={athlete.id} />
                            <input type="hidden" name="level" value="junior" />
                            <button
                              type="submit"
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700"
                            >
                              Coach Junior
                            </button>
                          </form>
                        )}
                        {canCreatePrincipal && (
                          <form action="/api/admin/promote-coach" method="POST">
                            <input type="hidden" name="athleteId" value={athlete.id} />
                            <input type="hidden" name="level" value="principal" />
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
                            >
                              Coach Principal
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {eligibleAthletes.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    Et {eligibleAthletes.length - 10} autres athlètes...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {!canCreateJunior && !canCreatePrincipal 
                  ? 'Vous n\'avez pas les permissions pour promouvoir des coaches'
                  : 'Aucun athlète éligible pour devenir coach'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}