'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Athlete {
  id: string
  name: string
  category?: string
}

interface Recommendation {
  id: string
  athlete_id: string
  coach_id: string
  title: string
  description: string
  priority: 'haute' | 'moyenne' | 'basse'
  read_status: boolean
  athlete: Athlete
}

interface EditRecommendationFormProps {
  recommendation: Recommendation
  athletes: Athlete[]
  coachId: string
}

export default function EditRecommendationForm({ recommendation, athletes, coachId }: EditRecommendationFormProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState(recommendation.athlete_id)
  const [title, setTitle] = useState(recommendation.title)
  const [description, setDescription] = useState(recommendation.description)
  const [priority, setPriority] = useState<'haute' | 'moyenne' | 'basse'>(recommendation.priority)
  const [readStatus, setReadStatus] = useState(recommendation.read_status)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const router = useRouter()
  const supabase = createClientComponentClient()

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
        .update({
          athlete_id: selectedAthleteId,
          title: title.trim(),
          description: description.trim(),
          priority,
          read_status: readStatus,
        })
        .eq('id', recommendation.id)

      if (error) throw error

      // Redirection vers la page des recommandations de l'athlète
      router.push(`/recommendations?athleteId=${selectedAthleteId}`)
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recommandation ? Cette action est irréversible.')) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('recommendations')
        .delete()
        .eq('id', recommendation.id)

      if (error) throw error

      // Redirection vers la page des recommandations
      router.push('/recommendations')
    } catch (error: any) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Sélection athlète */}
      <div>
        <label htmlFor="athlete" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Athlète <span className="text-red-500">*</span>
        </label>
        <select
          id="athlete"
          name="athlete"
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Titre de la recommandation <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Ex: Améliorer la garde en compétition"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Un titre court et clair (max 255 caractères)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priorité */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priorité <span className="text-red-500">*</span>
          </label>
          <select
            id="priority"
            name="priority"
            required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
          >
            <option value="basse">Basse - À travailler quand possible</option>
            <option value="moyenne">Moyenne - Important pour la progression</option>
            <option value="haute">Haute - Urgent, à corriger rapidement</option>
          </select>
        </div>

        {/* Statut de lecture */}
        <div>
          <label htmlFor="readStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Statut de lecture
          </label>
          <select
            id="readStatus"
            name="readStatus"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={readStatus ? 'true' : 'false'}
            onChange={(e) => setReadStatus(e.target.value === 'true')}
          >
            <option value="false">Non lu</option>
            <option value="true">Lu</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description détaillée <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={10}
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Décrivez en détail votre recommandation :
- Le problème observé
- Les exercices spécifiques à travailler
- Les objectifs à atteindre
- Les étapes de progression
- Les points d'attention particuliers"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Soyez précis et détaillé pour que l'athlète comprenne exactement quoi travailler.
        </p>
      </div>

      {/* Aperçu de la priorité */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Aperçu</h4>
        <div className="flex items-center space-x-3 mb-2">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            priority === 'haute' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {priority === 'haute' && '🔴'}
            {priority === 'moyenne' && '🟡'}
            {priority === 'basse' && '🟢'}
            <span className="ml-1 capitalize">{priority}</span>
          </div>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            !readStatus ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {!readStatus ? '🔵 Non lu' : '✅ Lu'}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {priority === 'haute' && 'Cette recommandation sera mise en évidence pour l\'athlète.'}
          {priority === 'moyenne' && 'Recommandation importante pour la progression.'}
          {priority === 'basse' && 'Recommandation à travailler sans urgence particulière.'}
        </p>
      </div>

      {message && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-600 dark:text-red-400">
            {message}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          Supprimer
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </form>
  )
}