import { requireAuth, getUserProfile } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect, notFound } from 'next/navigation'
import Navigation from '@/components/Navigation'
import EditAthleteForm from './EditAthleteForm'

interface EditAthletePageProps {
  params: { id: string }
}

export default async function EditAthletePage({ params }: EditAthletePageProps) {
  const user = await requireAuth()
  const profile = await getUserProfile()
  
  if (!profile || profile.role !== 'coach') {
    redirect('/dashboard')
  }

  // Récupérer l'athlète à éditer avec vérification des permissions
  const { data: athlete, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'athlete')
    .single()

  if (error || !athlete) {
    notFound()
  }

  // Vérifier les permissions hiérarchiques si nécessaire
  // Pour l'instant, tous les coaches peuvent éditer tous les athlètes
  // On pourrait ajouter une logique plus fine si besoin

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Modifier le profil
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Mettre à jour les informations de {athlete.name}
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <EditAthleteForm 
            athlete={athlete}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  )
}