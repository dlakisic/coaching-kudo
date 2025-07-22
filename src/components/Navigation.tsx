'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'

interface NavigationProps {
  userRole: 'coach' | 'athlete'
  userName: string
}

export default function Navigation({ userRole, userName }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const { theme, toggleTheme } = useTheme()

  // Helper pour les classes conditionnelles
  const isDark = theme === 'dark'
  
  const getNavClasses = () => {
    return `${
      isDark 
        ? 'bg-gray-900/95 border-gray-700/50' 
        : 'bg-white/95 border-gray-200/50'
    } backdrop-blur-lg shadow-lg border-b sticky top-0 z-40 transition-colors duration-300`
  }

  const getTextClasses = (variant: 'primary' | 'secondary' = 'primary') => {
    if (variant === 'secondary') {
      return isDark ? 'text-gray-400' : 'text-gray-500'
    }
    return isDark ? 'text-gray-100' : 'text-gray-900'
  }

  const getHoverClasses = () => {
    return isDark 
      ? 'hover:bg-gray-800 hover:text-blue-400' 
      : 'hover:bg-blue-50 hover:text-blue-600'
  }

  // Fermer les menus quand on navigue
  useEffect(() => {
    setIsOpen(false)
    setIsProfileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const coachNavItems = [
    { href: '/dashboard', label: 'Tableau de bord' },
    { href: '/athletes', label: 'Mes athlètes' },
    { href: '/calendar', label: 'Calendrier' },
    { href: '/notes', label: 'Notes' },
    { href: '/recommendations', label: 'Recommandations' },
    { href: '/admin/users', label: 'Utilisateurs' },
    { href: '/admin/coaches', label: 'Gestion Coaches' },
    { href: '/notifications-test', label: '🧪 Test Notifications' },
  ]

  const athleteNavItems = [
    { href: '/dashboard', label: 'Tableau de bord' },
    { href: '/calendar', label: 'Calendrier' },
    { href: '/my-recommendations', label: 'Mes recommandations' },
    { href: '/profile', label: 'Mon profil' },
    { href: '/notifications-test', label: '🧪 Test Notifications' },
  ]

  const navItems = userRole === 'coach' ? coachNavItems : athleteNavItems

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Navigation Desktop & Mobile */}
      <nav className={getNavClasses()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-sm">🥋</span>
                </div>
                <span className={`text-xl font-bold bg-gradient-to-r ${isDark ? 'from-blue-400 to-indigo-400' : 'from-blue-600 to-indigo-600'} bg-clip-text text-transparent`}>
                  Coaching Kudo
                </span>
              </Link>
            </div>

            {/* Navigation Desktop */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : `${getTextClasses('secondary')} ${getHoverClasses()}`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Profil utilisateur Desktop */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className={`text-sm font-medium ${getTextClasses()}`}>{userName}</div>
                    <div className={`text-xs capitalize ${getTextClasses('secondary')}`}>{userRole}</div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border ${isDark ? 'bg-gray-800 ring-gray-700 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className={`text-sm font-medium ${getTextClasses()}`}>{userName}</div>
                      <div className={`text-xs capitalize flex items-center mt-1 ${getTextClasses('secondary')}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${userRole === 'coach' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        {userRole}
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={toggleTheme}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center ${getTextClasses()} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        {isDark ? (
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          </svg>
                        )}
                        {isDark ? 'Mode clair' : 'Mode sombre'}
                      </button>
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Mobile Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-colors duration-200 ${getTextClasses('secondary')} ${getHoverClasses()}`}
              >
                <span className="sr-only">Ouvrir menu</span>
                <svg className={`h-6 w-6 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile Overlay */}
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
            <div className={`backdrop-blur-xl w-full max-w-sm h-full shadow-2xl transform transition-transform duration-300 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'}`}>
              <div className={`px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">🥋</span>
                    </div>
                    <div>
                      <div className={`font-medium ${getTextClasses()}`}>{userName}</div>
                      <div className={`text-sm capitalize ${getTextClasses('secondary')}`}>{userRole}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${getTextClasses('secondary')} ${isDark ? 'hover:text-gray-300' : 'hover:text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-2 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                        : `${getTextClasses()} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className={`pt-4 mt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    onClick={() => {
                      toggleTheme()
                      setIsOpen(false)
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl font-medium transition-colors duration-200 ${getTextClasses()} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    {isDark ? (
                      <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                    {isDark ? 'Mode clair' : 'Mode sombre'}
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      handleLogout()
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl font-medium transition-colors duration-200 ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close profile dropdown */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </>
  )
}