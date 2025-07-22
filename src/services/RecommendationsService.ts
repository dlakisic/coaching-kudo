import { supabaseAdmin } from '@/lib/supabase-admin'
import { createRecommendationSchema, updateRecommendationSchema, type CreateRecommendationInput, type UpdateRecommendationInput } from '@/schemas'
import { ERROR_MESSAGES } from '@/constants'
import { CoachLevel } from '@/constants'

export class RecommendationsService {
  /**
   * Crée une nouvelle recommandation
   */
  static async create(recommendationData: CreateRecommendationInput) {
    // Validation des données
    const validatedData = createRecommendationSchema.parse(recommendationData)

    // Vérifier que l'athlète existe et est actif
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from('profiles')
      .select('id, active')
      .eq('id', validatedData.athlete_id)
      .eq('role', 'athlete')
      .single()

    if (athleteError || !athlete) {
      throw new Error(ERROR_MESSAGES.ATHLETE_NOT_FOUND)
    }

    if (!athlete.active) {
      throw new Error('Impossible de créer une recommandation pour un athlète inactif')
    }

    // Créer la recommandation
    const { data, error } = await supabaseAdmin
      .from('recommendations')
      .insert(validatedData)
      .select(`
        *,
        coach:profiles!recommendations_coach_id_fkey(name),
        athlete:profiles!recommendations_athlete_id_fkey(name)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de la recommandation: ${error.message}`)
    }

    return data
  }

  /**
   * Met à jour une recommandation existante
   */
  static async update(recommendationData: UpdateRecommendationInput, requesterId: string, requesterCoachLevel?: CoachLevel) {
    // Validation des données
    const validatedData = updateRecommendationSchema.parse(recommendationData)
    const { id, ...updateData } = validatedData

    // Vérifier que la recommandation existe et les permissions
    const { data: existingRecommendation, error: recError } = await supabaseAdmin
      .from('recommendations')
      .select('*, coach:profiles!recommendations_coach_id_fkey(coach_level)')
      .eq('id', id)
      .single()

    if (recError || !existingRecommendation) {
      throw new Error(ERROR_MESSAGES.RECOMMENDATION_NOT_FOUND)
    }

    // Vérifier les permissions de modification
    const canEdit = await this.canEditRecommendation(existingRecommendation, requesterId, requesterCoachLevel)
    if (!canEdit) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Mettre à jour
    const { data, error } = await supabaseAdmin
      .from('recommendations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        coach:profiles!recommendations_coach_id_fkey(name),
        athlete:profiles!recommendations_athlete_id_fkey(name)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }

    return data
  }

  /**
   * Supprime une recommandation
   */
  static async delete(recommendationId: string, requesterId: string, requesterCoachLevel?: CoachLevel) {
    // Vérifier que la recommandation existe et les permissions
    const { data: existingRecommendation, error: recError } = await supabaseAdmin
      .from('recommendations')
      .select('*, coach:profiles!recommendations_coach_id_fkey(coach_level)')
      .eq('id', recommendationId)
      .single()

    if (recError || !existingRecommendation) {
      throw new Error(ERROR_MESSAGES.RECOMMENDATION_NOT_FOUND)
    }

    // Vérifier les permissions
    const canDelete = await this.canEditRecommendation(existingRecommendation, requesterId, requesterCoachLevel)
    if (!canDelete) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Supprimer
    const { error } = await supabaseAdmin
      .from('recommendations')
      .delete()
      .eq('id', recommendationId)

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }

    return true
  }

  /**
   * Récupère les recommandations d'un athlète avec permissions hiérarchiques
   */
  static async getByAthlete(athleteId: string, requesterId: string, requesterCoachLevel?: CoachLevel, requesterRole?: string) {
    let recommendationsQuery = supabaseAdmin
      .from('recommendations')
      .select(`
        *,
        coach:profiles!recommendations_coach_id_fkey(name)
      `)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    // Appliquer les permissions hiérarchiques
    if (requesterRole === 'athlete') {
      // Athlète ne voit que ses propres recommandations
      if (athleteId !== requesterId) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
      }
    } else if (requesterCoachLevel === 'junior') {
      // Coach junior voit ses recommandations + celles de ses superviseurs
      const supervisorIds = await this.getSupervisorIds()
      recommendationsQuery = recommendationsQuery.in('coach_id', [...supervisorIds, requesterId])
    }

    const { data, error } = await recommendationsQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des recommandations: ${error.message}`)
    }

    return data || []
  }

  /**
   * Récupère toutes les recommandations avec filtres et permissions
   */
  static async getAll(requesterId: string, requesterCoachLevel?: CoachLevel, filters: {
    athleteId?: string
    priority?: string
    readStatus?: boolean
    limit?: number
  } = {}) {
    let recommendationsQuery = supabaseAdmin
      .from('recommendations')
      .select(`
        *,
        coach:profiles!recommendations_coach_id_fkey(name),
        athlete:profiles!recommendations_athlete_id_fkey(name, category)
      `)
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (filters.athleteId) {
      recommendationsQuery = recommendationsQuery.eq('athlete_id', filters.athleteId)
    }
    if (filters.priority) {
      recommendationsQuery = recommendationsQuery.eq('priority', filters.priority)
    }
    if (typeof filters.readStatus === 'boolean') {
      recommendationsQuery = recommendationsQuery.eq('read_status', filters.readStatus)
    }
    if (filters.limit) {
      recommendationsQuery = recommendationsQuery.limit(filters.limit)
    }

    // Appliquer les permissions hiérarchiques
    if (requesterCoachLevel === 'junior') {
      const supervisorIds = await this.getSupervisorIds()
      recommendationsQuery = recommendationsQuery.in('coach_id', [...supervisorIds, requesterId])
    }

    const { data, error } = await recommendationsQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des recommandations: ${error.message}`)
    }

    return data || []
  }

  /**
   * Récupère une recommandation par ID avec vérification des permissions
   */
  static async getById(recommendationId: string, requesterId: string, requesterCoachLevel?: CoachLevel) {
    const { data: recommendation, error } = await supabaseAdmin
      .from('recommendations')
      .select(`
        *,
        coach:profiles!recommendations_coach_id_fkey(name, coach_level),
        athlete:profiles!recommendations_athlete_id_fkey(name, category)
      `)
      .eq('id', recommendationId)
      .single()

    if (error || !recommendation) {
      throw new Error(ERROR_MESSAGES.RECOMMENDATION_NOT_FOUND)
    }

    // Vérifier les permissions de lecture
    const canRead = await this.canReadRecommendation(recommendation, requesterId, requesterCoachLevel)
    if (!canRead) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    return recommendation
  }

  /**
   * Marque une recommandation comme lue
   */
  static async markAsRead(recommendationId: string, requesterId: string, requesterCoachLevel?: CoachLevel) {
    return this.update(
      { id: recommendationId, read_status: true },
      requesterId,
      requesterCoachLevel
    )
  }

  /**
   * Marque une recommandation comme non lue
   */
  static async markAsUnread(recommendationId: string, requesterId: string, requesterCoachLevel?: CoachLevel) {
    return this.update(
      { id: recommendationId, read_status: false },
      requesterId,
      requesterCoachLevel
    )
  }

  /**
   * Récupère les statistiques des recommandations
   */
  static async getStats(athleteId?: string, requesterId?: string, requesterCoachLevel?: CoachLevel) {
    let recommendationsQuery = supabaseAdmin
      .from('recommendations')
      .select('priority, read_status')

    if (athleteId) {
      recommendationsQuery = recommendationsQuery.eq('athlete_id', athleteId)
    }

    // Appliquer les permissions si nécessaire
    if (requesterCoachLevel === 'junior' && requesterId) {
      const supervisorIds = await this.getSupervisorIds()
      recommendationsQuery = recommendationsQuery.in('coach_id', [...supervisorIds, requesterId])
    }

    const { data, error } = await recommendationsQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`)
    }

    const stats = {
      total: data?.length || 0,
      unread: data?.filter(r => !r.read_status).length || 0,
      byPriority: {
        haute: data?.filter(r => r.priority === 'haute').length || 0,
        moyenne: data?.filter(r => r.priority === 'moyenne').length || 0,
        basse: data?.filter(r => r.priority === 'basse').length || 0
      }
    }

    return stats
  }

  // Méthodes utilitaires privées
  private static async canEditRecommendation(recommendation: any, requesterId: string, requesterCoachLevel?: CoachLevel): Promise<boolean> {
    // Super admin peut tout éditer
    if (requesterCoachLevel === 'super_admin') return true
    
    // Principal peut tout éditer
    if (requesterCoachLevel === 'principal') return true
    
    // Junior peut éditer ses recommandations + celles de ses superviseurs
    if (requesterCoachLevel === 'junior') {
      if (recommendation.coach_id === requesterId) return true
      
      const supervisorIds = await this.getSupervisorIds()
      return supervisorIds.includes(recommendation.coach_id)
    }
    
    // Coach normal peut seulement éditer ses propres recommandations
    return recommendation.coach_id === requesterId
  }

  private static async canReadRecommendation(recommendation: any, requesterId: string, requesterCoachLevel?: CoachLevel): Promise<boolean> {
    // Même logique que canEdit pour la lecture
    return this.canEditRecommendation(recommendation, requesterId, requesterCoachLevel)
  }

  private static async getSupervisorIds(): Promise<string[]> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('coach_level', ['super_admin', 'principal'])

    return data?.map(p => p.id) || []
  }
}