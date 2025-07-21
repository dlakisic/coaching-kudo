import { requireRole } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default async function Athletes() {
  const profile = await requireRole('coach')
  const supabase = await createServerComponentClient()

  // Récupérer seulement les athlètes assignés à ce coach
  const { data: assignedAthletes } = await supabase
    .from('coach_athlete_assignments')
    .select(`
      athlete:profiles!athlete_id (
        id,
        name,
        email,
        category,
        grade,
        weight,
        height,
        active,
        created_at,
        updated_at
      )
    `)
    .eq('coach_id', profile.id)

  // Récupérer les athlètes en attente de validation (pour tous les coaches)
  const { data: pendingAthletes } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'athlete')
    .eq('active', false)
    .order('created_at')

  // Extraire les données des athlètes assignés
  const activeAthletes = assignedAthletes?.map(a => a.athlete).filter(athlete => athlete.active) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes athlètes</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos compétiteurs et validez les nouvelles inscriptions
          </p>
        </div>

        {/* Athlètes en attente de validation */}
        {pendingAthletes && pendingAthletes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              En attente de validation ({pendingAthletes.length})
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Ces athlètes attendent validation et assignment à un coach.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingAthletes.map((athlete) => (
                <div key={athlete.id} className="bg-white border border-yellow-300 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{athlete.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      En attente
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p><span className="font-medium">Email:</span> {athlete.email}</p>
                    {athlete.category && <p><span className="font-medium">Catégorie:</span> {athlete.category}</p>}
                    {athlete.grade && <p><span className="font-medium">Grade:</span> {athlete.grade}</p>}
                    {athlete.weight && <p><span className="font-medium">Poids:</span> {athlete.weight} kg</p>}
                    {athlete.height && <p><span className="font-medium">Taille:</span> {athlete.height} cm</p>}
                  </div>
                  <div className="flex space-x-2">
                    <form action="/api/athletes/validate" method="POST" className="flex-1">
                      <input type="hidden" name="athleteId" value={athlete.id} />
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Valider
                      </button>
                    </form>
                    <form action="/api/athletes/reject" method="POST" className="flex-1">
                      <input type="hidden" name="athleteId" value={athlete.id} />
                      <button
                        type="submit"
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Refuser
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Athlètes actifs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Athlètes actifs ({activeAthletes.length})
            </h2>
            <Link
              href="/athletes/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Ajouter un athlète
            </Link>
          </div>

          {activeAthletes.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h10M17 24h10M17 28h10m12-3V7a2 2 0 00-2-2H7a2 2 0 00-2 2v38a2 2 0 002 2h26a2 2 0 002-2V19l-8-8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun athlète actif</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par ajouter ou valider des athlètes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAthletes.map((athlete) => (
                <div key={athlete.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{athlete.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {athlete.category && <p><span className="font-medium">Catégorie:</span> {athlete.category}</p>}
                    {athlete.grade && <p><span className="font-medium">Grade:</span> {athlete.grade}</p>}
                    {athlete.weight && <p><span className="font-medium">Poids:</span> {athlete.weight} kg</p>}
                    {athlete.height && <p><span className="font-medium">Taille:</span> {athlete.height} cm</p>}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/athletes/${athlete.id}`}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium text-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Voir détails
                    </Link>
                    <Link
                      href={`/notes/new?athleteId=${athlete.id}`}
                      className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium text-center hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Nouvelle note
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}