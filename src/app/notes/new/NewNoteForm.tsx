'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Athlete {
  id: string
  name: string
  category?: string
}

interface NewNoteFormProps {
  athletes: Athlete[]
  preselectedAthleteId?: string
  coachId: string
}

export default function NewNoteForm({ athletes, preselectedAthleteId, coachId }: NewNoteFormProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState(preselectedAthleteId || '')
  const [category, setCategory] = useState<'technique' | 'mental' | 'physique' | 'tactique'>('technique')
  const [context, setContext] = useState<'entrainement' | 'competition'>('entrainement')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
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

      if (!content.trim()) {
        throw new Error('Veuillez saisir le contenu de la note')
      }

      const { error } = await supabase
        .from('notes')
        .insert({
          coach_id: coachId,
          athlete_id: selectedAthleteId,
          category,
          context,
          date,
          content: content.trim(),
        })

      if (error) throw error

      // Redirection vers la page des notes de l'athlète
      router.push(`/notes?athleteId=${selectedAthleteId}`)
    } catch (error: any) {
      setMessage(error.message)
    } finally {
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

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          name="date"
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Catégorie */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            <option value="technique">Technique</option>
            <option value="mental">Mental</option>
            <option value="physique">Physique</option>
            <option value="tactique">Tactique</option>
          </select>
        </div>

        {/* Contexte */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contexte <span className="text-red-500">*</span>
          </label>
          <select
            id="context"
            name="context"
            required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={context}
            onChange={(e) => setContext(e.target.value as any)}
          >
            <option value="entrainement">Entraînement</option>
            <option value="competition">Compétition</option>
          </select>
        </div>
      </div>

      {/* Contenu de la note */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observation <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          rows={8}
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Décrivez vos observations, les points forts, les axes d'amélioration, les exercices recommandés..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Soyez précis et constructif dans vos observations.
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
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
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
          {loading ? 'Sauvegarde...' : 'Créer la note'}
        </button>
      </div>
    </form>
  )
}