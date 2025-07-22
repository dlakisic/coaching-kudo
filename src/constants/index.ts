// UI Constants
export const UI_CONSTANTS = {
  PREVIEW_ITEMS_COUNT: 3,
  TEXTAREA_DEFAULT_ROWS: 4,
  TEXTAREA_LARGE_ROWS: 8,
  TEXTAREA_EXTRA_LARGE_ROWS: 10,
  MODAL_MAX_WIDTH_SM: 'sm:max-w-sm',
  MODAL_MAX_WIDTH_MD: 'sm:max-w-lg', 
  MODAL_MAX_WIDTH_LG: 'sm:max-w-2xl',
  MODAL_MAX_WIDTH_XL: 'sm:max-w-4xl'
} as const

// Data Limits
export const DATA_LIMITS = {
  TITLE_MAX_LENGTH: 255,
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 2000,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  WEIGHT_MIN: 1,
  WEIGHT_MAX: 200,
  HEIGHT_MIN: 1,
  HEIGHT_MAX: 250,
  RECENT_NOTES_LIMIT: 5,
  RECENT_RECOMMENDATIONS_LIMIT: 3,
  TIMELINE_ITEMS_LIMIT: 10
} as const

// Categories & Enums
export const NOTE_CATEGORIES = [
  'technique',
  'mental', 
  'physique',
  'tactique'
] as const

export const NOTE_CONTEXTS = [
  'entrainement',
  'competition'
] as const

export const RECOMMENDATION_PRIORITIES = [
  'basse',
  'moyenne', 
  'haute'
] as const

export const ATHLETE_CATEGORIES = [
  'Minimes',
  'Cadets',
  'Juniors', 
  'Seniors',
  'Vétérans'
] as const

export const GRADES = [
  'Débutant',
  'Ceinture blanche',
  'Ceinture jaune',
  'Ceinture orange',
  'Ceinture verte',
  'Ceinture bleue',
  'Ceinture marron',
  'Ceinture noire 1er dan',
  'Ceinture noire 2ème dan',
  'Ceinture noire 3ème dan'
] as const

export const COACH_LEVELS = [
  'junior',
  'principal',
  'super_admin'
] as const

export const USER_ROLES = [
  'athlete',
  'coach'
] as const

// Calendar Constants
export const EVENT_TYPES = [
  'training',
  'competition', 
  'individual_session',
  'meeting',
  'other'
] as const

export const EVENT_STATUS = [
  'active',
  'cancelled',
  'completed'
] as const

export const EVENT_VISIBILITY = [
  'public',
  'private',
  'coaches_only'
] as const

export const PARTICIPANT_STATUS = [
  'invited',
  'accepted',
  'declined', 
  'maybe',
  'attended',
  'absent'
] as const

export const EVENT_COLORS = {
  training: '#3b82f6',      // Blue
  competition: '#ef4444',   // Red
  individual_session: '#10b981', // Green
  meeting: '#f59e0b',       // Yellow
  other: '#6b7280'          // Gray
} as const

// Type definitions from constants
export type NoteCategory = typeof NOTE_CATEGORIES[number]
export type NoteContext = typeof NOTE_CONTEXTS[number] 
export type RecommendationPriority = typeof RECOMMENDATION_PRIORITIES[number]
export type AthleteCategory = typeof ATHLETE_CATEGORIES[number]
export type Grade = typeof GRADES[number]
export type CoachLevel = typeof COACH_LEVELS[number]
export type UserRole = typeof USER_ROLES[number]
export type EventType = typeof EVENT_TYPES[number]
export type EventStatus = typeof EVENT_STATUS[number]
export type EventVisibility = typeof EVENT_VISIBILITY[number]
export type ParticipantStatus = typeof PARTICIPANT_STATUS[number]

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Ce champ est obligatoire',
  INVALID_EMAIL: 'Format d\'email invalide',
  CONTENT_TOO_SHORT: `Le contenu doit faire au moins ${DATA_LIMITS.CONTENT_MIN_LENGTH} caractères`,
  CONTENT_TOO_LONG: `Le contenu ne peut pas dépasser ${DATA_LIMITS.CONTENT_MAX_LENGTH} caractères`,
  TITLE_TOO_LONG: `Le titre ne peut pas dépasser ${DATA_LIMITS.TITLE_MAX_LENGTH} caractères`,
  INVALID_WEIGHT: `Le poids doit être entre ${DATA_LIMITS.WEIGHT_MIN} et ${DATA_LIMITS.WEIGHT_MAX} kg`,
  INVALID_HEIGHT: `La taille doit être entre ${DATA_LIMITS.HEIGHT_MIN} et ${DATA_LIMITS.HEIGHT_MAX} cm`,
  UNAUTHORIZED: 'Vous n\'avez pas les permissions pour cette action',
  ATHLETE_NOT_FOUND: 'Athlète introuvable',
  NOTE_NOT_FOUND: 'Note introuvable', 
  RECOMMENDATION_NOT_FOUND: 'Recommandation introuvable'
} as const