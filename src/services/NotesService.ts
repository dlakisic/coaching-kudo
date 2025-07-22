import { supabaseAdmin } from '@/lib/supabase-admin'
import { createNoteSchema, updateNoteSchema, type CreateNoteInput, type UpdateNoteInput } from '@/schemas'
import { ERROR_MESSAGES, DATA_LIMITS } from '@/constants'
import { CoachLevel } from '@/constants'

export class NotesService {
  /**
   * Crée une nouvelle note d'entraînement
   */
  static async create(noteData: CreateNoteInput) {
    // Validation des données
    const validatedData = createNoteSchema.parse(noteData)

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
      throw new Error('Impossible de créer une note pour un athlète inactif')
    }

    // Créer la note
    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert(validatedData)
      .select(`
        *,
        coach:profiles!notes_coach_id_fkey(name),
        athlete:profiles!notes_athlete_id_fkey(name)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de la note: ${error.message}`)
    }

    return data
  }

  /**
   * Met à jour une note existante
   */
  static async update(noteData: UpdateNoteInput, requesterId: string, requesterCoachLevel?: CoachLevel) {
    // Validation des données
    const validatedData = updateNoteSchema.parse(noteData)
    const { id, ...updateData } = validatedData

    // Vérifier que la note existe et les permissions
    const { data: existingNote, error: noteError } = await supabaseAdmin
      .from('notes')
      .select('*, coach:profiles!notes_coach_id_fkey(coach_level)')
      .eq('id', id)
      .single()

    if (noteError || !existingNote) {
      throw new Error(ERROR_MESSAGES.NOTE_NOT_FOUND)
    }

    // Vérifier les permissions de modification
    const canEdit = await this.canEditNote(existingNote, requesterId, requesterCoachLevel)
    if (!canEdit) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Mettre à jour
    const { data, error } = await supabaseAdmin
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        coach:profiles!notes_coach_id_fkey(name),
        athlete:profiles!notes_athlete_id_fkey(name)
      `)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }

    return data
  }

  /**
   * Supprime une note
   */
  static async delete(noteId: string, requesterId: string, requesterCoachLevel?: CoachLevel) {
    // Vérifier que la note existe et les permissions
    const { data: existingNote, error: noteError } = await supabaseAdmin
      .from('notes')
      .select('*, coach:profiles!notes_coach_id_fkey(coach_level)')
      .eq('id', noteId)
      .single()

    if (noteError || !existingNote) {
      throw new Error(ERROR_MESSAGES.NOTE_NOT_FOUND)
    }

    // Vérifier les permissions
    const canDelete = await this.canEditNote(existingNote, requesterId, requesterCoachLevel)
    if (!canDelete) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Supprimer
    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }

    return true
  }

  /**
   * Récupère les notes d'un athlète avec permissions hiérarchiques
   */
  static async getByAthlete(athleteId: string, requesterId: string, requesterCoachLevel?: CoachLevel, requesterRole?: string) {
    let notesQuery = supabaseAdmin
      .from('notes')
      .select(`
        *,
        coach:profiles!notes_coach_id_fkey(name)
      `)
      .eq('athlete_id', athleteId)
      .order('date', { ascending: false })

    // Appliquer les permissions hiérarchiques
    if (requesterRole === 'athlete') {
      // Athlète ne voit que ses propres notes
      if (athleteId !== requesterId) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
      }
    } else if (requesterCoachLevel === 'junior') {
      // Coach junior voit ses notes + celles de ses superviseurs
      const supervisorIds = await this.getSupervisorIds()
      notesQuery = notesQuery.in('coach_id', [...supervisorIds, requesterId])
    }
    // Super admin et principal voient toutes les notes

    const { data, error } = await notesQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des notes: ${error.message}`)
    }

    return data || []
  }

  /**
   * Récupère toutes les notes avec filtres et permissions
   */
  static async getAll(requesterId: string, requesterCoachLevel?: CoachLevel, filters: {
    athleteId?: string
    category?: string
    context?: string
    limit?: number
  } = {}) {
    let notesQuery = supabaseAdmin
      .from('notes')
      .select(`
        *,
        coach:profiles!notes_coach_id_fkey(name),
        athlete:profiles!notes_athlete_id_fkey(name, category)
      `)
      .order('date', { ascending: false })

    // Appliquer les filtres
    if (filters.athleteId) {
      notesQuery = notesQuery.eq('athlete_id', filters.athleteId)
    }
    if (filters.category) {
      notesQuery = notesQuery.eq('category', filters.category)
    }
    if (filters.context) {
      notesQuery = notesQuery.eq('context', filters.context)
    }
    if (filters.limit) {
      notesQuery = notesQuery.limit(filters.limit)
    }

    // Appliquer les permissions hiérarchiques
    if (requesterCoachLevel === 'junior') {
      const supervisorIds = await this.getSupervisorIds()
      notesQuery = notesQuery.in('coach_id', [...supervisorIds, requesterId])
    }

    const { data, error } = await notesQuery

    if (error) {
      throw new Error(`Erreur lors de la récupération des notes: ${error.message}`)
    }

    return data || []
  }

  /**
   * Récupère une note par ID avec vérification des permissions
   */
  static async getById(noteId: string, requesterId: string, requesterCoachLevel?: CoachLevel) {
    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .select(`
        *,
        coach:profiles!notes_coach_id_fkey(name, coach_level),
        athlete:profiles!notes_athlete_id_fkey(name, category)
      `)
      .eq('id', noteId)
      .single()

    if (error || !note) {
      throw new Error(ERROR_MESSAGES.NOTE_NOT_FOUND)
    }

    // Vérifier les permissions de lecture
    const canRead = await this.canReadNote(note, requesterId, requesterCoachLevel)
    if (!canRead) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }

    return note
  }

  // Méthodes utilitaires privées
  private static async canEditNote(note: any, requesterId: string, requesterCoachLevel?: CoachLevel): Promise<boolean> {
    // Super admin peut tout éditer
    if (requesterCoachLevel === 'super_admin') return true
    
    // Principal peut tout éditer
    if (requesterCoachLevel === 'principal') return true
    
    // Junior peut éditer ses notes + celles de ses superviseurs
    if (requesterCoachLevel === 'junior') {
      if (note.coach_id === requesterId) return true
      
      const supervisorIds = await this.getSupervisorIds()
      return supervisorIds.includes(note.coach_id)
    }
    
    // Coach normal peut seulement éditer ses propres notes
    return note.coach_id === requesterId
  }

  private static async canReadNote(note: any, requesterId: string, requesterCoachLevel?: CoachLevel): Promise<boolean> {
    // Même logique que canEdit pour la lecture
    return this.canEditNote(note, requesterId, requesterCoachLevel)
  }

  private static async getSupervisorIds(): Promise<string[]> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('coach_level', ['super_admin', 'principal'])

    return data?.map(p => p.id) || []
  }
}