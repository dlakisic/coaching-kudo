'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Athlete {
  id: string
  name: string
  email: string
  category?: string
  grade?: string
  weight?: number
  height?: number
  active: boolean
}

interface EditAthleteFormProps {
  athlete: Athlete
  currentUserId: string
}

export default function EditAthleteForm({ athlete, currentUserId }: EditAthleteFormProps) {
  const [name, setName] = useState(athlete.name)
  const [email, setEmail] = useState(athlete.email)
  const [category, setCategory] = useState(athlete.category || '')
  const [grade, setGrade] = useState(athlete.grade || '')
  const [weight, setWeight] = useState(athlete.weight?.toString() || '')
  const [height, setHeight] = useState(athlete.height?.toString() || '')
  const [active, setActive] = useState(athlete.active)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')

  const router = useRouter()
  const supabase = createClientComponentClient()

  const categories = [
    'Minimes',
    'Cadets',
    'Juniors',
    'Seniors',
    'Vétérans'
  ]

  const grades = [
    'Débutant',
    'Ceinture blanche',
    'Ceinture jaune',
    'Ceinture orange',
    'Ceinture verte',
    'Ceinture bleue',
    'Ceinture marron',
    'Ceinture noire 1er dan',
    'Ceinture noire 2ème dan',
    'Ceinture noire 3ème dan'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!name.trim()) {
        throw new Error('Le nom est obligatoire')
      }

      if (!email.trim()) {
        throw new Error('L\'email est obligatoire')
      }

      // Validation email basique
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw new Error('Format d\'email invalide')
      }

      // Validation poids et taille
      const weightNum = weight ? parseFloat(weight) : null
      const heightNum = height ? parseFloat(height) : null

      if (weight && (isNaN(weightNum!) || weightNum! <= 0 || weightNum! > 200)) {
        throw new Error('Le poids doit être entre 1 et 200 kg')
      }

      if (height && (isNaN(heightNum!) || heightNum! <= 0 || heightNum! > 250)) {
        throw new Error('La taille doit être entre 1 et 250 cm')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          category: category || null,
          grade: grade || null,
          weight: weightNum,
          height: heightNum,
          active,
        })
        .eq('id', athlete.id)

      if (error) throw error

      setMessage('Profil mis à jour avec succès')
      setMessageType('success')
      
      // Redirection après un délai
      setTimeout(() => {
        router.push(`/athletes/${athlete.id}`)
      }, 1500)
    } catch (error: any) {
      setMessage(error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Informations de base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ⚠️ Attention : modifier l'email peut affecter la connexion de l'utilisateur
          </p>
        </div>
      </div>

      {/* Catégorie et Grade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Catégorie
          </label>
          <select
            id="category"
            name="category"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grade
          </label>
          <select
            id="grade"
            name="grade"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">Sélectionner un grade</option>
            {grades.map((gradeOption) => (
              <option key={gradeOption} value={gradeOption}>
                {gradeOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Poids et Taille */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Poids (kg)
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            step="0.1"
            min="1"
            max="200"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ex: 70.5"
          />
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Taille (cm)
          </label>
          <input
            type="number"
            id="height"
            name="height"
            step="1"
            min="1"
            max="250"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Ex: 175"
          />
        </div>
      </div>

      {/* Statut actif */}
      <div>
        <label htmlFor="active" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Statut
        </label>
        <select
          id="active"
          name="active"
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={active ? 'true' : 'false'}
          onChange={(e) => setActive(e.target.value === 'true')}
        >
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Les athlètes inactifs n'apparaissent plus dans les listes principales
        </p>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className={`text-sm ${
            messageType === 'success' 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          ID: {athlete.id.slice(0, 8)}...
        </div>
        
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
            {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </div>
    </form>
  )
}