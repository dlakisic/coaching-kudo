'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        throw error
      }

      // Supabase redirige automatiquement vers Google
      console.log('✅ Redirection vers Google...')
      
    } catch (err) {
      console.error('❌ Erreur connexion Google:', err)
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      router.push('/login')
    } catch (err) {
      console.error('❌ Erreur déconnexion:', err)
      setError(err instanceof Error ? err.message : 'Erreur de déconnexion')
    } finally {
      setLoading(false)
    }
  }

  return {
    signInWithGoogle,
    signOut,
    loading,
    error
  }
}