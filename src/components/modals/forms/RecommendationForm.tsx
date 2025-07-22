'use client'

import { useRecommendationForm } from '@/hooks/useRecommendationForm'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { RECOMMENDATION_PRIORITIES, UI_CONSTANTS, DATA_LIMITS } from '@/constants'

interface RecommendationFormProps {
  athleteId: string
  coachId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function RecommendationForm({ athleteId, coachId, onSuccess, onCancel }: RecommendationFormProps) {
  const {
    title,
    description,
    priority,
    loading,
    message,
    setTitle,
    setDescription,
    setPriority,
    handleSubmit
  } = useRecommendationForm({ athleteId, coachId, onSuccess })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titre */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Titre
        </label>
        <input
          type="text"
          id="title"
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Ex: Améliorer la garde en compétition"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={DATA_LIMITS.TITLE_MAX_LENGTH}
        />
      </div>

      {/* Priorité */}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Priorité
        </label>
        <select
          id="priority"
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
        >
          {RECOMMENDATION_PRIORITIES.map((prio) => (
            <option key={prio} value={prio}>
              {prio.charAt(0).toUpperCase() + prio.slice(1)} - {
                prio === 'basse' ? 'À travailler quand possible' :
                prio === 'moyenne' ? 'Important pour la progression' :
                'Urgent, à corriger rapidement'
              }
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={UI_CONSTANTS.TEXTAREA_DEFAULT_ROWS + 1}
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Décrivez votre recommandation détaillée..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DATA_LIMITS.CONTENT_MAX_LENGTH}
        />
      </div>

      {/* Aperçu priorité */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          priority === 'haute' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
          priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        }`}>
          {priority === 'haute' && '🔴'}
          {priority === 'moyenne' && '🟡'}
          {priority === 'basse' && '🟢'}
          <span className="ml-1 capitalize">{priority}</span>
        </div>
      </div>

      <ErrorMessage message={message} />

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-500 disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer la recommandation'}
        </button>
      </div>
    </form>
  )
}