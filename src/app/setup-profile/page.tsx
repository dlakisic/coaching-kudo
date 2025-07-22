'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SetupProfile() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    // Vérifier si l'utilisateur a déjà un profil actif
    const checkProfile = async () => {
      console.log('SetupProfile: Checking for existing profile...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('SetupProfile: No user found, redirecting to login')
        router.push('/login')
        return
      }
      
      console.log('SetupProfile: User found:', user.email)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('SetupProfile: Profile check result:', { profile, error })
      
      if (profile && profile.active) {
        console.log('SetupProfile: Active profile found, redirecting to dashboard')
        router.push('/dashboard')
        return
      }
      
      if (profile && !profile.active) {
        console.log('SetupProfile: Inactive profile found, staying on setup')
      }
    }
    
    checkProfile()
  }, [router, supabase])
  const [name, setName] = useState('')
  const [role, setRole] = useState<'coach' | 'athlete'>('athlete')
  const [category, setCategory] = useState('')
  const [grade, setGrade] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Utilisateur non connecté')

      const profileData = {
        id: user.id,
        email: user.email,
        name,
        role,
        category: category || null,
        grade: grade || null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        active: false, // Tous les athlètes doivent être validés // Les athlètes doivent être validés
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (error) throw error
      
      setMessage('Profil créé ! En attente de validation par un coach.')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configurer votre profil
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Votre nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Rôle fixé à athlète - seuls les athlètes peuvent s'inscrire */}
            <input type="hidden" name="role" value="athlete" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Inscription en tant qu'athlète
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Vous vous inscrivez en tant qu'athlète. Les comptes coaches sont attribués par l'administration.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Toujours afficher les champs athlète */}
            <>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Catégorie
                  </label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: Senior, Junior..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                    Grade/Ceinture
                  </label>
                  <input
                    id="grade"
                    name="grade"
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ex: Ceinture noire 1er dan..."
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                      Poids (kg)
                    </label>
                    <input
                      id="weight"
                      name="weight"
                      type="number"
                      step="0.1"
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                      Taille (cm)
                    </label>
                    <input
                      id="height"
                      name="height"
                      type="number"
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="175"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                </div>
              </>
          </div>

          {message && (
            <div className={`text-sm text-center ${message.includes('validation') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Créer mon profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}