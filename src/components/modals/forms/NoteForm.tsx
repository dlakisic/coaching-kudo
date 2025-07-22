'use client'

import { useNoteForm } from '@/hooks/useNoteForm'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { NOTE_CATEGORIES, NOTE_CONTEXTS, UI_CONSTANTS } from '@/constants'

interface NoteFormProps {
  athleteId: string
  coachId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function NoteForm({ athleteId, coachId, onSuccess, onCancel }: NoteFormProps) {
  const {
    category,
    context,
    date,
    content,
    loading,
    message,
    setCategory,
    setContext,
    setDate,
    setContent,
    handleSubmit
  } = useNoteForm({ athleteId, coachId, onSuccess })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <input
          type="date"
          id="date"
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Catégorie */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catégorie
          </label>
          <select
            id="category"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            {NOTE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Contexte */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contexte
          </label>
          <select
            id="context"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={context}
            onChange={(e) => setContext(e.target.value as any)}
          >
            {NOTE_CONTEXTS.map((ctx) => (
              <option key={ctx} value={ctx}>
                {ctx.charAt(0).toUpperCase() + ctx.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenu */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observation
        </label>
        <textarea
          id="content"
          rows={UI_CONSTANTS.TEXTAREA_DEFAULT_ROWS}
          required
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Vos observations..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Sauvegarde...' : 'Créer la note'}
        </button>
      </div>
    </form>
  )
}