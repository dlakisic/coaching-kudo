'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Profile } from '@/types'

export default function NewRecommendation() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [athletes, setAthletes] = useState<Profile[]>([])
  const [selectedAthleteId, setSelectedAthleteId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'haute' | 'moyenne' | 'basse'>('moyenne')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadProfile()
    loadAthletes()
    
    // Pré-sélectionner l'athlète si passé en paramètre
    const athleteId = searchParams.get('athleteId')
    if (athleteId) {
      setSelectedAthleteId(athleteId)
    }
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
  }

  const loadAthletes = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'athlete')
      .eq('active', true)
      .order('name')
    setAthletes(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!selectedAthleteId) {
        throw new Error('Veuillez sélectionner un athlète')
      }

      if (!title.trim()) {
        throw new Error('Le titre est obligatoire')
      }

      if (!description.trim()) {
        throw new Error('La description est obligatoire')
      }

      const { error } = await supabase
        .from('recommendations')
        .insert({
          coach_id: profile?.id,
          athlete_id: selectedAthleteId,
          title: title.trim(),
          description: description.trim(),
          priority,
          read_status: false,
        })

      if (error) throw error

      router.push(`/recommendations?athleteId=${selectedAthleteId}`)
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!profile || profile.role !== 'coach') {
    return <div>Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole={profile.role} userName={profile.name} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle recommandation</h1>
          <p className="mt-2 text-gray-600">
            Créer un conseil personnalisé pour un athlète
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Sélection athlète */}
            <div>
              <label htmlFor="athlete" className="block text-sm font-medium text-gray-700 mb-2">
                Athlète <span className="text-red-500">*</span>
              </label>
              <select
                id="athlete"
                name="athlete"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
              >
                <option value="">Choisir un athlète...</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name} {athlete.category && `(${athlete.category})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la recommandation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: Améliorer la garde en compétition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
              />
              <p className="mt-1 text-sm text-gray-500">
                Un titre court et clair (max 255 caractères)
              </p>
            </div>

            {/* Priorité */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priorité <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="basse">Basse - À travailler quand possible</option>
                <option value="moyenne">Moyenne - Important pour la progression</option>
                <option value="haute">Haute - Urgent, à corriger rapidement</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description détaillée <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={10}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Décrivez en détail votre recommandation :
- Le problème observé
- Les exercices spécifiques à travailler
- Les objectifs à atteindre
- Les étapes de progression
- Les points d'attention particuliers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-500">
                Soyez précis et détaillé pour que l'athlète comprenne exactement quoi travailler.
              </p>
            </div>

            {/* Aperçu de la priorité */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Aperçu de la priorité</h4>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                priority === 'haute' ? 'bg-red-100 text-red-800' :
                priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {priority === 'haute' && '🔴'}
                {priority === 'moyenne' && '🟡'}
                {priority === 'basse' && '🟢'}
                <span className="ml-1 capitalize">{priority}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {priority === 'haute' && 'Cette recommandation sera mise en évidence pour l\'athlète.'}
                {priority === 'moyenne' && 'Recommandation importante pour la progression.'}
                {priority === 'basse' && 'Recommandation à travailler sans urgence particulière.'}
              </p>
            </div>

            {message && (
              <div className="text-sm text-center text-red-600">
                {message}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer la recommandation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}