'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClientComponentClient()

      try {
        // Supabase gère automatiquement le callback OAuth
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Erreur auth callback:', error)
          setStatus('error')
          setMessage(error.message)
          return
        }

        if (data.session) {
          console.log('✅ Session créée:', data.session.user.email)
          
          // Vérifier si l'utilisateur a un profil
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Pas de profil trouvé, créer un nouveau profil
            await createUserProfile(supabase, data.session.user)
            router.push('/setup-profile?from=google')
          } else if (profile) {
            // Profil existe, rediriger vers dashboard
            setStatus('success')
            setMessage('Connexion réussie ! Redirection...')
            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
          } else {
            throw profileError
          }
        } else {
          throw new Error('Aucune session créée')
        }

      } catch (err) {
        console.error('❌ Erreur traitement callback:', err)
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  const createUserProfile = async (supabase: any, user: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          photo: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          role: 'athlete', // Par défaut, l'utilisateur sera athlète
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Erreur création profil:', error)
        throw error
      }

      console.log('✅ Profil créé pour:', user.email)
    } catch (error) {
      console.error('❌ Erreur création profil:', error)
      throw error
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connexion en cours...
          </h2>
          <p className="text-gray-600">
            Finalisation de votre connexion Google
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-green-600 mb-2">
            Connexion réussie !
          </h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          Erreur de connexion
        </h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/login')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Réessayer
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            🏠 Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}