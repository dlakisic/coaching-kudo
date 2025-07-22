import { requireAuth, getUserProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import NewRecommendationForm from './NewRecommendationForm'

export default async function NewRecommendationPage({ searchParams }: { searchParams: Promise<{ athleteId?: string }> }) {
  const params = await searchParams
  const user = await requireAuth()
  const profile = await getUserProfile()
  
  if (!profile || profile.role !== 'coach') {
    redirect('/dashboard')
  }

  // Récupérer les athlètes visibles selon les permissions
  const { data: athletes } = await supabaseAdmin
    .from('profiles')
    .select('id, name, category')
    .eq('role', 'athlete')
    .eq('active', true)
    .order('name')

  const preselectedAthlete = params.athleteId 
    ? athletes?.find(a => a.id === params.athleteId)
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Nouvelle recommandation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {preselectedAthlete 
              ? `Créer une recommandation pour ${preselectedAthlete.name}`
              : 'Créer un conseil personnalisé pour un athlète'
            }
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <NewRecommendationForm 
            athletes={athletes || []}
            preselectedAthleteId={params.athleteId}
            coachId={user.id}
          />
        </div>
      </div>
    </div>
  )
}