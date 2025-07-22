import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotesService } from '../NotesService'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ERROR_MESSAGES } from '@/constants'

// Mock Supabase
vi.mock('@/lib/supabase-admin')

const mockSupabaseAdmin = vi.mocked(supabaseAdmin)

describe('NotesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a note with valid data', async () => {
      const mockAthlete = { id: 'athlete-id', active: true }
      const mockNote = {
        id: 'note-id',
        athlete_id: 'athlete-id',
        coach_id: 'coach-id',
        category: 'technique',
        context: 'entrainement',
        date: '2024-01-01',
        content: 'Test content for note creation'
      }

      // Mock athlete check
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAthlete, error: null })
      } as any)

      // Mock note creation
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNote, error: null })
      } as any)

      const noteData = {
        athlete_id: 'athlete-id',
        coach_id: 'coach-id',
        category: 'technique' as const,
        context: 'entrainement' as const,
        date: '2024-01-01',
        content: 'Test content for note creation'
      }

      const result = await NotesService.create(noteData)
      expect(result).toEqual(mockNote)
    })

    it('should throw error when athlete not found', async () => {
      // Mock athlete check - not found
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      } as any)

      const noteData = {
        athlete_id: 'invalid-id',
        coach_id: 'coach-id',
        category: 'technique' as const,
        context: 'entrainement' as const,
        date: '2024-01-01',
        content: 'Test content'
      }

      await expect(NotesService.create(noteData)).rejects.toThrow(ERROR_MESSAGES.ATHLETE_NOT_FOUND)
    })

    it('should throw error when athlete is inactive', async () => {
      const mockInactiveAthlete = { id: 'athlete-id', active: false }

      // Mock athlete check - inactive
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInactiveAthlete, error: null })
      } as any)

      const noteData = {
        athlete_id: 'athlete-id',
        coach_id: 'coach-id',
        category: 'technique' as const,
        context: 'entrainement' as const,
        date: '2024-01-01',
        content: 'Test content'
      }

      await expect(NotesService.create(noteData)).rejects.toThrow('Impossible de créer une note pour un athlète inactif')
    })

    it('should validate data with Zod schema', async () => {
      const invalidNoteData = {
        athlete_id: 'not-a-uuid',
        coach_id: 'coach-id',
        category: 'invalid-category' as any,
        context: 'entrainement' as const,
        date: '2024-01-01',
        content: 'Short' // Too short based on DATA_LIMITS.CONTENT_MIN_LENGTH = 10
      }

      await expect(NotesService.create(invalidNoteData)).rejects.toThrow()
    })
  })

  describe('getByAthlete', () => {
    it('should return notes for athlete with proper permissions', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'First note',
          athlete_id: 'athlete-id',
          coach: { name: 'Coach Name' }
        }
      ]

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockNotes, error: null })
      } as any)

      const result = await NotesService.getByAthlete(
        'athlete-id',
        'coach-id',
        'super_admin',
        'coach'
      )

      expect(result).toEqual(mockNotes)
    })

    it('should throw error when athlete tries to access other athlete notes', async () => {
      await expect(
        NotesService.getByAthlete('other-athlete-id', 'athlete-id', undefined, 'athlete')
      ).rejects.toThrow(ERROR_MESSAGES.UNAUTHORIZED)
    })
  })

  describe('delete', () => {
    it('should delete note when user has permissions', async () => {
      const mockNote = {
        id: 'note-id',
        coach_id: 'coach-id',
        coach: { coach_level: 'junior' }
      }

      // Mock note existence check
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNote, error: null })
      } as any)

      // Mock delete
      mockSupabaseAdmin.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      } as any)

      const result = await NotesService.delete('note-id', 'coach-id', 'super_admin')
      expect(result).toBe(true)
    })

    it('should throw error when note not found', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      } as any)

      await expect(
        NotesService.delete('invalid-id', 'coach-id', 'super_admin')
      ).rejects.toThrow(ERROR_MESSAGES.NOTE_NOT_FOUND)
    })
  })
})