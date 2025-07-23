import { createClient } from '@supabase/supabase-js'

// Fallback client if admin client is not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
import { 
  createEventSchema, 
  updateEventSchema, 
  createParticipantSchema, 
  updateParticipantSchema,
  type CreateEventInput, 
  type UpdateEventInput,
  type CreateParticipantInput,
  type UpdateParticipantInput 
} from '@/schemas'
import { ERROR_MESSAGES, EVENT_COLORS } from '@/constants'
import { CoachLevel, EventType } from '@/constants'
import { startOfDay, endOfDay, addDays, format } from 'date-fns'

export class CalendarService {
  /**
   * Crée un nouvel événement
   */
  static async createEvent(eventData: CreateEventInput, userSupabaseClient?: any) {
    // Utiliser le client utilisateur s'il est fourni, sinon le client service
    const clientToUse = userSupabaseClient || supabase
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await clientToUse.auth.getUser()

    if (!user) {
      throw new Error('Utilisateur non authentifié')
    }

    // Validation des données
    const validatedData = createEventSchema.parse(eventData)

    // Ajouter la couleur par défaut selon le type
    if (!validatedData.color) {
      validatedData.color = EVENT_COLORS[validatedData.event_type as EventType] || EVENT_COLORS.other
    }

    // Créer l'événement
    const { data, error } = await clientToUse
      .from('calendar_events')
      .insert(validatedData)
      .select(`
        *,
        organizer:profiles!calendar_events_organizer_id_fkey(name)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de l'événement: ${error.message}`)
    }

    return data
  }

  /**
   * Met à jour un événement existant
   */
  static async updateEvent(eventData: UpdateEventInput, requesterId: string, requesterCoachLevel?: CoachLevel) {
    // Validation des données
    const validatedData = updateEventSchema.parse(eventData)
    const { id, ...updateData } = validatedData

    // Vérifier que l'événement existe et les permissions
    const { data: existingEvent, error: eventError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single()

    if (eventError || !existingEvent) {
      throw new Error('Événement introuvable')
    }

    // Vérifier les permissions de modification
    const canEdit = await this.canEditEvent(existingEvent, requesterId, requesterCoachLevel)
    if (!canEdit) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Mettre à jour
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        organizer:profiles!calendar_events_organizer_id_fkey(name)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }

    return data
  }

  /**
   * Supprime un événement
   */
  static async deleteEvent(eventId: string, requesterId: string, requesterCoachLevel?: CoachLevel) {
    // Vérifier que l'événement existe et les permissions
    const { data: existingEvent, error: eventError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !existingEvent) {
      throw new Error('Événement introuvable')
    }

    // Vérifier les permissions
    const canDelete = await this.canEditEvent(existingEvent, requesterId, requesterCoachLevel)
    if (!canDelete) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Supprimer (cascade supprimera automatiquement les participants)
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }

    return true
  }

  /**
   * Récupère les événements pour une période donnée
   */
  static async getEvents(
    requesterId: string, 
    requesterRole: string,
    requesterCoachLevel?: CoachLevel,
    filters: {
      startDate?: Date
      endDate?: Date
      eventType?: string
      organizerId?: string
    } = {}
  ) {
    // Requête simplifiée sans jointures pour éviter la récursion RLS
    let eventsQuery = supabase
      .from('calendar_events')
      .select('*')
      .eq('status', 'active')
      .order('start_datetime')

    // Filtres par date
    if (filters.startDate) {
      eventsQuery = eventsQuery.gte('start_datetime', filters.startDate.toISOString())
    }
    if (filters.endDate) {
      eventsQuery = eventsQuery.lte('start_datetime', filters.endDate.toISOString())
    }

    // Filtres par type et organisateur
    if (filters.eventType) {
      eventsQuery = eventsQuery.eq('event_type', filters.eventType)
    }
    if (filters.organizerId) {
      eventsQuery = eventsQuery.eq('organizer_id', filters.organizerId)
    }

    // Appliquer les permissions de visibilité
    if (requesterRole === 'athlete') {
      // Les athlètes voient les événements publics ou ceux auxquels ils participent
      // Cette logique est gérée par RLS, mais on peut ajouter un filtre côté application
    } else if (requesterRole === 'coach') {
      // Les coaches voient selon leur niveau (géré par RLS)
    }

    const { data, error } = await eventsQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des événements: ${error.message}`)
    }

    if (!data) return []

    // Récupérer les données des organisateurs et participants séparément
    const eventsWithDetails = await Promise.all(
      data.map(async (event) => {
        // Récupérer l'organisateur
        const { data: organizer } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', event.organizer_id)
          .single()

        // Récupérer les participants
        const { data: participants } = await supabase
          .from('calendar_event_participants')
          .select(`
            participant_id,
            status,
            coach_notes,
            responded_at
          `)
          .eq('event_id', event.id)

        // Récupérer les détails des participants
        const participantsWithDetails = participants ? await Promise.all(
          participants.map(async (p) => {
            const { data: participant } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', p.participant_id)
              .single()

            return {
              ...p,
              participant: participant || { name: 'Utilisateur inconnu', email: '' }
            }
          })
        ) : []

        return {
          ...event,
          organizer: organizer || { name: 'Organisateur inconnu' },
          participants: participantsWithDetails
        }
      })
    )

    return eventsWithDetails
  }

  /**
   * Récupère un événement par ID avec les participants
   */
  static async getEventById(eventId: string, requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel) {
    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        organizer:profiles!calendar_events_organizer_id_fkey(name, coach_level),
        participants:calendar_event_participants(
          participant_id,
          status,
          coach_notes,
          responded_at,
          participant:profiles!calendar_event_participants_participant_id_fkey(name, email, category)
        )
      `)
      .eq('id', eventId)
      .single()

    if (error || !event) {
      throw new Error('Événement introuvable')
    }

    // Vérifier les permissions de lecture
    const canRead = await this.canReadEvent(event, requesterId, requesterRole, requesterCoachLevel)
    if (!canRead) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    return event
  }

  /**
   * Ajoute un participant à un événement
   */
  static async addParticipant(participantData: CreateParticipantInput, requesterId: string) {
    // Validation des données
    const validatedData = createParticipantSchema.parse(participantData)

    // Vérifier que l'organisateur peut ajouter des participants
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('organizer_id, max_participants')
      .eq('id', validatedData.event_id)
      .single()

    if (eventError || !event) {
      throw new Error('Événement introuvable')
    }

    if (event.organizer_id !== requesterId) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Vérifier la limite de participants
    if (event.max_participants) {
      const { count } = await supabase
        .from('calendar_event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', validatedData.event_id)

      if (count && count >= event.max_participants) {
        throw new Error('Nombre maximum de participants atteint')
      }
    }

    // Vérifier que le participant existe et est un athlète
    const { data: participant, error: participantError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', validatedData.participant_id)
      .single()

    if (participantError || !participant) {
      throw new Error('Participant introuvable')
    }

    // Ajouter le participant
    const { data, error } = await supabase
      .from('calendar_event_participants')
      .insert(validatedData)
      .select(`
        *,
        participant:profiles!calendar_event_participants_participant_id_fkey(name, email)
      `)
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Ce participant est déjà ajouté à l\'événement')
      }
      throw new Error(`Erreur lors de l'ajout du participant: ${error.message}`)
    }

    return data
  }

  /**
   * Met à jour le statut d'un participant
   */
  static async updateParticipant(participantData: UpdateParticipantInput, requesterId: string, requesterRole: string) {
    // Validation des données
    const validatedData = updateParticipantSchema.parse(participantData)

    // Vérifier que la participation existe
    const { data: participation, error: participationError } = await supabase
      .from('calendar_event_participants')
      .select(`
        *,
        event:calendar_events!calendar_event_participants_event_id_fkey(organizer_id)
      `)
      .eq('event_id', validatedData.event_id)
      .eq('participant_id', validatedData.participant_id)
      .single()

    if (participationError || !participation) {
      throw new Error('Participation introuvable')
    }

    // Vérifier les permissions
    const canUpdate = (
      participation.participant_id === requesterId || // Le participant lui-même
      (requesterRole === 'coach' && participation.event.organizer_id === requesterId) // L'organisateur
    )

    if (!canUpdate) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Préparer les données de mise à jour
    const updateData: any = { status: validatedData.status }
    
    // Seul l'organisateur peut ajouter des notes de coach
    if (validatedData.coach_notes && participation.event.organizer_id === requesterId) {
      updateData.coach_notes = validatedData.coach_notes
    }

    // Ajouter la date de réponse si le statut change
    if (participation.status !== validatedData.status) {
      updateData.responded_at = new Date().toISOString()
    }

    // Mettre à jour
    const { data, error } = await supabase
      .from('calendar_event_participants')
      .update(updateData)
      .eq('event_id', validatedData.event_id)
      .eq('participant_id', validatedData.participant_id)
      .select(`
        *,
        participant:profiles!calendar_event_participants_participant_id_fkey(name)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }

    return data
  }

  /**
   * Supprime un participant d'un événement
   */
  static async removeParticipant(eventId: string, participantId: string, requesterId: string) {
    // Vérifier que l'organisateur peut supprimer des participants
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('organizer_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Événement introuvable')
    }

    if (event.organizer_id !== requesterId) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Supprimer la participation
    const { error } = await supabase
      .from('calendar_event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('participant_id', participantId)

    if (error) {
      throw new Error(`Erreur lors de la suppression du participant: ${error.message}`)
    }

    return true
  }

  /**
   * Récupère les événements du jour
   */
  static async getTodayEvents(requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel) {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    return this.getEvents(requesterId, requesterRole, requesterCoachLevel, {
      startDate: startOfToday,
      endDate: endOfToday
    })
  }

  /**
   * Récupère les événements de la semaine
   */
  static async getWeekEvents(requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel, weekStart?: Date) {
    const start = weekStart || new Date()
    const endOfWeek = addDays(start, 7)

    return this.getEvents(requesterId, requesterRole, requesterCoachLevel, {
      startDate: start,
      endDate: endOfWeek
    })
  }

  /**
   * Récupère les statistiques du calendrier
   */
  static async getCalendarStats(requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel) {
    if (requesterRole !== 'coach') {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('event_type, status, start_datetime')
      .eq('status', 'active')

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`)
    }

    const stats = {
      total: events?.length || 0,
      byType: {} as Record<string, number>,
      thisMonth: 0,
      nextWeek: 0
    }

    const now = new Date()
    const nextWeek = addDays(now, 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    events?.forEach(event => {
      // Par type
      stats.byType[event.event_type] = (stats.byType[event.event_type] || 0) + 1
      
      const eventDate = new Date(event.start_datetime)
      
      // Ce mois
      if (eventDate >= startOfMonth && eventDate <= endOfMonth) {
        stats.thisMonth++
      }
      
      // Prochaine semaine
      if (eventDate >= now && eventDate <= nextWeek) {
        stats.nextWeek++
      }
    })

    return stats
  }

  // Méthodes utilitaires privées
  private static async canEditEvent(event: any, requesterId: string, requesterCoachLevel?: CoachLevel): Promise<boolean> {
    // Super admin peut tout éditer
    if (requesterCoachLevel === 'super_admin') return true
    
    // L'organisateur peut éditer son événement
    if (event.organizer_id === requesterId) return true
    
    // Principal peut éditer les événements des autres coaches
    if (requesterCoachLevel === 'principal') return true
    
    return false
  }

  private static async canReadEvent(event: any, requesterId: string, requesterRole: string, requesterCoachLevel?: CoachLevel): Promise<boolean> {
    // Public events can be read by everyone
    if (event.visibility === 'public') return true
    
    // Private events can only be read by organizer
    if (event.visibility === 'private') {
      return event.organizer_id === requesterId
    }
    
    // Coaches only events can be read by coaches
    if (event.visibility === 'coaches_only') {
      return requesterRole === 'coach'
    }
    
    // Check if user is a participant
    const isParticipant = event.participants?.some((p: any) => p.participant_id === requesterId)
    if (isParticipant) return true
    
    // Organizer can always read
    if (event.organizer_id === requesterId) return true
    
    return false
  }
}