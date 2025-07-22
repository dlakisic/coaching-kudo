import { requireAuth, getUserProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'

export default async function Dashboard() {
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/setup-profile')
  }

  // Récupérer les vraies données selon les permissions
  let athletesCount = 0
  let notesCount = 0
  let recommendationsCount = 0

  if (profile.role === 'coach') {
    // Compter les athlètes visibles
    let athletesQuery = supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'athlete')
      .eq('active', true)

    const { count } = await athletesQuery
    athletesCount = count || 0

    // Compter les notes selon les permissions
    let notesQuery = supabaseAdmin
      .from('notes')
      .select('id', { count: 'exact', head: true })

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
    }

    const { count: notesCountResult } = await notesQuery
    notesCount = notesCountResult || 0

    // Compter les recommandations selon les permissions
    let recsQuery = supabaseAdmin
      .from('recommendations')
      .select('id', { count: 'exact', head: true })

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
    }

    const { count: recsCountResult } = await recsQuery
    recommendationsCount = recsCountResult || 0
  } else {
    // Pour les athlètes : compter leurs propres données
    const { count: notesCountResult } = await supabaseAdmin
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', user.id)
    
    notesCount = notesCountResult || 0

    const { count: recsCountResult } = await supabaseAdmin
      .from('recommendations')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', user.id)
    
    recommendationsCount = recsCountResult || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord - {profile.role === 'coach' ? 'Coach' : 'Athlète'}
          </h1>
          <p className="mt-2 text-gray-600">
            Bienvenue {profile.name}
          </p>
        </div>

        {profile.role === 'coach' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">👥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Mes athlètes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {athletesCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">📝</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Notes récentes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {notesCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">💡</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recommandations
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {recommendationsCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Mes recommandations
                </h3>
                <p className="text-gray-500">
                  Aucune recommandation pour le moment
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Mon profil
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Catégorie:</span> {profile.category || 'Non définie'}</p>
                  <p><span className="font-medium">Grade:</span> {profile.grade || 'Non défini'}</p>
                  <p><span className="font-medium">Poids:</span> {profile.weight ? `${profile.weight} kg` : 'Non défini'}</p>
                  <p><span className="font-medium">Taille:</span> {profile.height ? `${profile.height} cm` : 'Non définie'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}