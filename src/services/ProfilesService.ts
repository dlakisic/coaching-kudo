import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateAthleteProfileSchema, type UpdateAthleteProfileInput } from '@/schemas'
import { ERROR_MESSAGES } from '@/constants'
import { CoachLevel } from '@/constants'

export class ProfilesService {
  /**
   * Met à jour le profil d'un athlète
   */
  static async updateAthlete(profileData: UpdateAthleteProfileInput, requesterId: string, requesterRole: string) {
    // Validation des données
    const validatedData = updateAthleteProfileSchema.parse(profileData)
    const { id, ...updateData } = validatedData

    // Seuls les coaches peuvent modifier les profils d'athlètes
    if (requesterRole !== 'coach') {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Vérifier que l'athlète existe
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'athlete')
      .single()

    if (profileError || !existingProfile) {
      throw new Error(ERROR_MESSAGES.ATHLETE_NOT_FOUND)
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateData.email && updateData.email !== existingProfile.email) {
      const { data: emailExists } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', id)
        .single()

      if (emailExists) {
        throw new Error('Cette adresse email est déjà utilisée')
      }
    }

    // Mettre à jour le profil
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`)
    }

    return data
  }

  /**
   * Récupère un profil avec vérification des permissions
   */
  static async getById(profileId: string, requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel) {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error || !profile) {
      throw new Error('Profil introuvable')
    }

    // Vérifier les permissions de lecture
    const canRead = await this.canReadProfile(profile, requesterId, requesterRole, requesterCoachLevel)
    if (!canRead) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    return profile
  }

  /**
   * Récupère tous les athlètes visibles pour l'utilisateur
   */
  static async getVisibleAthletes(requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel) {
    let athletesQuery = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'athlete')
      .eq('active', true)
      .order('name')

    // Les athlètes ne voient que leur propre profil
    if (requesterRole === 'athlete') {
      athletesQuery = athletesQuery.eq('id', requesterId)
    }

    const { data, error } = await athletesQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des athlètes: ${error.message}`)
    }

    return data || []
  }

  /**
   * Récupère tous les profils (coaches et athlètes) avec permissions
   */
  static async getVisibleProfiles(requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel) {
    // Seuls les coaches peuvent voir tous les profils
    if (requesterRole !== 'coach') {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('role')
      .order('name')

    const { data, error } = await profilesQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des profils: ${error.message}`)
    }

    return data || []
  }

  /**
   * Récupère les statistiques des profils
   */
  static async getStats(requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel) {
    // Seuls les coaches peuvent voir les stats
    if (requesterRole !== 'coach') {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('role, active, category, coach_level')

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`)
    }

    const stats = {
      athletes: {
        total: profiles?.filter(p => p.role === 'athlete').length || 0,
        active: profiles?.filter(p => p.role === 'athlete' && p.active).length || 0,
        byCategory: {} as Record<string, number>
      },
      coaches: {
        total: profiles?.filter(p => p.role === 'coach').length || 0,
        byLevel: {
          super_admin: profiles?.filter(p => p.coach_level === 'super_admin').length || 0,
          principal: profiles?.filter(p => p.coach_level === 'principal').length || 0,
          junior: profiles?.filter(p => p.coach_level === 'junior').length || 0,
          normal: profiles?.filter(p => p.role === 'coach' && !p.coach_level).length || 0
        }
      }
    }

    // Compter par catégorie
    profiles?.filter(p => p.role === 'athlete' && p.category).forEach(p => {
      stats.athletes.byCategory[p.category] = (stats.athletes.byCategory[p.category] || 0) + 1
    })

    return stats
  }

  /**
   * Active/désactive un profil d'athlète
   */
  static async toggleAthleteStatus(athleteId: string, requesterId: string, requesterRole: string) {
    // Seuls les coaches peuvent modifier le statut
    if (requesterRole !== 'coach') {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Récupérer le profil actuel
    const { data: currentProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('active')
      .eq('id', athleteId)
      .eq('role', 'athlete')
      .single()

    if (fetchError || !currentProfile) {
      throw new Error(ERROR_MESSAGES.ATHLETE_NOT_FOUND)
    }

    // Inverser le statut
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ active: !currentProfile.active })
      .eq('id', athleteId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erreur lors de la modification du statut: ${error.message}`)
    }

    return data
  }

  // Méthodes utilitaires privées
  private static async canReadProfile(profile: any, requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel): Promise<boolean> {
    // L'utilisateur peut toujours voir son propre profil
    if (profile.id === requesterId) return true

    // Les athlètes ne peuvent voir que leur propre profil
    if (requesterRole === 'athlete') return false

    // Les coaches peuvent voir les profils selon leur niveau
    if (requesterRole === 'coach') {
      // Super admin et principal voient tout
      if (requesterCoachLevel === 'super_admin' || requesterCoachLevel === 'principal') {
        return true
      }

      // Coach junior ou normal peuvent voir les athlètes
      if (profile.role === 'athlete') return true

      // Pour voir d'autres coaches, il faut être au moins principal
      return false
    }

    return false
  }
}