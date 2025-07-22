'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Badge } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'

interface Profile {
  id: string
  name: string
  email: string
  role: 'coach' | 'athlete'
  coach_level?: string
  grade?: string
  category?: string
  weight?: number
  height?: number
  active: boolean
  managed_by?: string
}

interface AdminUsersClientProps {
  profiles: Profile[]
}

export default function AdminUsersClient({ profiles }: AdminUsersClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  // Séparer coaches et athlètes
  const coaches = profiles.filter(p => p.role === 'coach')
  const athletes = profiles.filter(p => p.role === 'athlete')

  const getPageClasses = () => {
    return `min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`
  }

  const getTitleClasses = () => {
    return `text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`
  }

  const getSubtitleClasses = () => {
    return `mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`
  }

  const getSecondaryTextClasses = () => {
    return isDark ? 'text-gray-400' : 'text-gray-500'
  }

  const getSectionTitleClasses = () => {
    return `text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`
  }

  return (
    <div className={getPageClasses()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={getTitleClasses()}>
            Gestion des Utilisateurs
          </h1>
          <p className={getSubtitleClasses()}>
            Tous les utilisateurs visibles selon votre niveau d'autorisation
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-5">
                  <div className={`text-sm font-medium ${getSecondaryTextClasses()}`}>
                    Total Utilisateurs
                  </div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {profiles.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">🏃</span>
                  </div>
                </div>
                <div className="ml-5">
                  <div className={`text-sm font-medium ${getSecondaryTextClasses()}`}>
                    Athlètes
                  </div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {athletes.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">👨‍🏫</span>
                  </div>
                </div>
                <div className="ml-5">
                  <div className={`text-sm font-medium ${getSecondaryTextClasses()}`}>
                    Coaches
                  </div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {coaches.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Coaches */}
        {coaches.length > 0 && (
          <div className="mb-8">
            <h2 className={getSectionTitleClasses()}>
              Coaches ({coaches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaches.map((coach) => (
                <Card key={coach.id} variant="outlined">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{coach.name}</CardTitle>
                      <Badge 
                        variant="gradient"
                        className="ml-2"
                      >
                        {coach.coach_level?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Email:</span> {coach.email}
                      </p>
                      <p>
                        <span className="font-medium">Grade:</span> {coach.grade || 'Non défini'}
                      </p>
                      <p>
                        <span className="font-medium">Statut:</span>{' '}
                        <Badge variant={coach.active ? 'success' : 'danger'}>
                          {coach.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </p>
                      {coach.managed_by && (
                        <p className={`text-xs ${getSecondaryTextClasses()}`}>
                          Supervisé par: {coaches.find(c => c.id === coach.managed_by)?.name || 'Coach supérieur'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Section Athlètes */}
        {athletes.length > 0 && (
          <div>
            <h2 className={getSectionTitleClasses()}>
              Athlètes ({athletes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {athletes.map((athlete) => (
                <Card key={athlete.id} variant="outlined" hover={true}>
                  <Link href={`/athletes/${athlete.id}`} className="block">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                          {athlete.name}
                        </CardTitle>
                        <Badge variant="info">
                          Athlète
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Email:</span> {athlete.email}
                        </p>
                        <p>
                          <span className="font-medium">Catégorie:</span> {athlete.category || 'Non définie'}
                        </p>
                        <p>
                          <span className="font-medium">Grade:</span> {athlete.grade || 'Non défini'}
                        </p>
                        {athlete.weight && athlete.height && (
                          <p>
                            <span className="font-medium">Profil:</span> {athlete.weight}kg, {athlete.height}cm
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Statut:</span>{' '}
                          <Badge variant={athlete.active ? 'success' : 'danger'}>
                            {athlete.active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Aucun utilisateur */}
        {profiles.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className={getSecondaryTextClasses()}>
                <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
                <p>Il semblerait qu'aucun utilisateur ne soit visible avec vos permissions actuelles.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}