'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { useTheme } from '@/contexts/ThemeContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { isDark } = useTheme()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'athlete'
            }
          }
        })
        
        if (error) throw error
        setMessage('Vérifiez votre email pour confirmer votre compte')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">

        {/* Card de connexion */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 transform transition-transform duration-300 hover:scale-110">
              <span className="text-2xl">🥋</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? 'Créer un compte' : 'Coaching Kudo'}
            </h2>
            <p className="text-blue-200">
              {isSignUp ? 'Inscription athlète' : 'Plateforme de coaching'}
            </p>
          </div>
        
          <form className="space-y-6" onSubmit={handleAuth}>
            <div className="space-y-4">
              {/* Email Field */}
              <div className="group">
                <label htmlFor="email-address" className="block text-sm font-medium text-blue-100 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 backdrop-blur-sm transition-all duration-300"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 backdrop-blur-sm transition-all duration-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl text-sm text-center ${
                message.includes('Vérifiez') 
                  ? 'bg-green-500/20 text-green-100 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-100 border border-red-500/30'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-gray-900 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
            </button>

            {/* Séparateur "ou" */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-blue-900/50 text-blue-200">ou</span>
              </div>
            </div>

            {/* Google Sign In */}
            <div className="transform transition-all duration-300 hover:scale-105">
              <GoogleSignInButton 
                text={isSignUp ? "S'inscrire avec Google" : "Continuer avec Google"}
                variant="secondary"
              />
            </div>

            {/* Toggle */}
            <div className="text-center">
              <button
                type="button"
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
              </button>
            </div>
          </form>

          {/* Info section */}
          {!isSignUp && (
            <div className="mt-8 text-center">
              <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
                <h3 className="text-white font-medium mb-3">🥋 Club de Kudo - Rennes</h3>
                <div className="text-blue-200 text-sm space-y-2">
                  <p><strong>Coaches :</strong> Accédez à vos outils de suivi</p>
                  <p><strong>Athlètes :</strong> Consultez vos recommandations</p>
                </div>
              </div>
            </div>
          )}

          {isSignUp && (
            <div className="mt-8 text-center">
              <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30">
                <div className="text-yellow-100 text-sm space-y-2">
                  <p><strong>ℹ️ Information importante</strong></p>
                  <p>Seuls les athlètes peuvent s'inscrire.</p>
                  <p>Votre compte sera validé par un coach.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}