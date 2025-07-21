import { requireRole } from '@/lib/auth'
import { createServerComponentClient } from '@/lib/supabase-server'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

export default async function Notes({ searchParams }: { searchParams: { athleteId?: string } }) {
  const profile = await requireRole('coach')
  const supabase = await createServerComponentClient()

  // Récupérer les notes avec les informations des athlètes
  let notesQuery = supabase
    .from('notes')
    .select(`
      *,
      athlete:profiles!athlete_id (
        id,
        name,
        category
      )
    `)
    .eq('coach_id', profile.id)
    .order('date', { ascending: false })

  // Filtrer par athlète si spécifié
  if (searchParams.athleteId) {
    notesQuery = notesQuery.eq('athlete_id', searchParams.athleteId)
  }

  const { data: notes } = await notesQuery

  // Récupérer la liste des athlètes pour le filtre
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, name, category')
    .eq('role', 'athlete')
    .eq('active', true)
    .order('name')

  const selectedAthlete = searchParams.athleteId 
    ? athletes?.find(a => a.id === searchParams.athleteId)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedAthlete ? `Notes de ${selectedAthlete.name}` : 'Toutes les notes'}
            </h1>
            <p className="mt-2 text-gray-600">
              {selectedAthlete 
                ? `Historique des observations pour ${selectedAthlete.name}`
                : 'Gérez vos notes d\'entraînement et de compétition'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedAthlete && (
              <Link
                href="/notes"
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Toutes les notes
              </Link>
            )}
            <Link
              href={`/notes/new${searchParams.athleteId ? `?athleteId=${searchParams.athleteId}` : ''}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Nouvelle note
            </Link>
          </div>
        </div>

        {/* Filtres */}
        {!selectedAthlete && athletes && athletes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filtrer par athlète</h3>
            <div className="flex flex-wrap gap-2">
              {athletes.map((athlete) => (
                <Link
                  key={athlete.id}
                  href={`/notes?athleteId=${athlete.id}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                >
                  {athlete.name}
                  {athlete.category && <span className="ml-1 text-xs">({athlete.category})</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Liste des notes */}
        {notes && notes.length > 0 ? (
          <div className="space-y-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {!selectedAthlete && (
                      <Link
                        href={`/athletes/${note.athlete.id}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-800"
                      >
                        {note.athlete.name}
                      </Link>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        note.category === 'technique' ? 'bg-blue-100 text-blue-800' :
                        note.category === 'mental' ? 'bg-purple-100 text-purple-800' :
                        note.category === 'physique' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {note.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        note.context === 'competition' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {note.context}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <time className="text-sm font-medium text-gray-900">
                      {new Date(note.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <p className="text-xs text-gray-500 mt-1">
                      Créé le {new Date(note.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-900 leading-relaxed">{note.content}</p>
                </div>

                <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href={`/notes/${note.id}/edit`}
                    className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m6 0h6m-6 6v6m6-6v6m-6 6h6" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {selectedAthlete ? `Aucune note pour ${selectedAthlete.name}` : 'Aucune note'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première note d'entraînement.
            </p>
            <div className="mt-6">
              <Link
                href={`/notes/new${searchParams.athleteId ? `?athleteId=${searchParams.athleteId}` : ''}`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Nouvelle note
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}