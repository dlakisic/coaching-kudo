import { z } from 'zod'
import { 
  DATA_LIMITS, 
  ERROR_MESSAGES, 
  NOTE_CATEGORIES, 
  NOTE_CONTEXTS, 
  RECOMMENDATION_PRIORITIES,
  ATHLETE_CATEGORIES,
  GRADES,
  EVENT_TYPES,
  EVENT_STATUS,
  EVENT_VISIBILITY,
  PARTICIPANT_STATUS
} from '@/constants'

// Base schemas
const emailSchema = z
  .string()
  .email(ERROR_MESSAGES.INVALID_EMAIL)
  .max(DATA_LIMITS.EMAIL_MAX_LENGTH)

const nameSchema = z
  .string()
  .min(DATA_LIMITS.NAME_MIN_LENGTH, ERROR_MESSAGES.REQUIRED_FIELD)
  .max(DATA_LIMITS.NAME_MAX_LENGTH)
  .trim()

// Note schemas
export const createNoteSchema = z.object({
  athlete_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  category: z.enum(NOTE_CATEGORIES),
  context: z.enum(NOTE_CONTEXTS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  content: z
    .string()
    .min(DATA_LIMITS.CONTENT_MIN_LENGTH, ERROR_MESSAGES.CONTENT_TOO_SHORT)
    .max(DATA_LIMITS.CONTENT_MAX_LENGTH, ERROR_MESSAGES.CONTENT_TOO_LONG)
    .trim()
})

export const updateNoteSchema = createNoteSchema.partial().extend({
  id: z.string().uuid()
})

// Recommendation schemas
export const createRecommendationSchema = z.object({
  athlete_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  title: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(DATA_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
  description: z
    .string()
    .min(DATA_LIMITS.CONTENT_MIN_LENGTH, ERROR_MESSAGES.CONTENT_TOO_SHORT)
    .max(DATA_LIMITS.CONTENT_MAX_LENGTH, ERROR_MESSAGES.CONTENT_TOO_LONG)
    .trim(),
  priority: z.enum(RECOMMENDATION_PRIORITIES),
  read_status: z.boolean().default(false)
})

export const updateRecommendationSchema = createRecommendationSchema.partial().extend({
  id: z.string().uuid()
})

// Profile schemas
export const updateAthleteProfileSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  email: emailSchema,
  category: z.enum(ATHLETE_CATEGORIES).optional(),
  grade: z.enum(GRADES).optional(),
  weight: z
    .number()
    .min(DATA_LIMITS.WEIGHT_MIN, ERROR_MESSAGES.INVALID_WEIGHT)
    .max(DATA_LIMITS.WEIGHT_MAX, ERROR_MESSAGES.INVALID_WEIGHT)
    .optional(),
  height: z
    .number()
    .min(DATA_LIMITS.HEIGHT_MIN, ERROR_MESSAGES.INVALID_HEIGHT)
    .max(DATA_LIMITS.HEIGHT_MAX, ERROR_MESSAGES.INVALID_HEIGHT)
    .optional(),
  active: z.boolean()
})

// Form input schemas (for client-side validation)
export const noteFormSchema = z.object({
  athleteId: z.string().uuid(),
  category: z.enum(NOTE_CATEGORIES),
  context: z.enum(NOTE_CONTEXTS), 
  date: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  content: z
    .string()
    .min(DATA_LIMITS.CONTENT_MIN_LENGTH, ERROR_MESSAGES.CONTENT_TOO_SHORT)
    .max(DATA_LIMITS.CONTENT_MAX_LENGTH, ERROR_MESSAGES.CONTENT_TOO_LONG)
    .trim()
})

export const recommendationFormSchema = z.object({
  athleteId: z.string().uuid(),
  title: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(DATA_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
  description: z
    .string()
    .min(DATA_LIMITS.CONTENT_MIN_LENGTH, ERROR_MESSAGES.CONTENT_TOO_SHORT)
    .max(DATA_LIMITS.CONTENT_MAX_LENGTH, ERROR_MESSAGES.CONTENT_TOO_LONG)
    .trim(),
  priority: z.enum(RECOMMENDATION_PRIORITIES)
})

export const athleteProfileFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  category: z.string().optional(),
  grade: z.string().optional(),
  weight: z.string().optional().transform((val) => {
    if (!val || val === '') return undefined
    const num = parseFloat(val)
    if (isNaN(num)) throw new Error(ERROR_MESSAGES.INVALID_WEIGHT)
    return num
  }),
  height: z.string().optional().transform((val) => {
    if (!val || val === '') return undefined
    const num = parseFloat(val)
    if (isNaN(num)) throw new Error(ERROR_MESSAGES.INVALID_HEIGHT)
    return num
  }),
  active: z.boolean()
})

// Calendar schemas
export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(DATA_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
  description: z.string().optional(),
  event_type: z.enum(EVENT_TYPES),
  start_datetime: z.string().datetime(), // ISO string
  end_datetime: z.string().datetime(),
  all_day: z.boolean().default(false),
  location: z.string().optional(),
  organizer_id: z.string().uuid(),
  max_participants: z.number().int().positive().optional(),
  visibility: z.enum(EVENT_VISIBILITY).default('public'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
}).refine(
  (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
  {
    message: "La date de fin doit être après la date de début",
    path: ["end_datetime"],
  }
)

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid()
})

export const createParticipantSchema = z.object({
  event_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  status: z.enum(PARTICIPANT_STATUS).default('invited')
})

export const updateParticipantSchema = z.object({
  event_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  status: z.enum(PARTICIPANT_STATUS),
  coach_notes: z.string().optional()
})

// Form schemas
export const eventFormSchema = z.object({
  title: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(DATA_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
  description: z.string().optional(),
  eventType: z.enum(EVENT_TYPES),
  startDate: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  startTime: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  endDate: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  endTime: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  maxParticipants: z.string().optional().transform((val) => {
    if (!val || val === '') return undefined
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) throw new Error('Le nombre de participants doit être positif')
    return num
  }),
  visibility: z.enum(EVENT_VISIBILITY).default('public'),
  participants: z.array(z.string().uuid()).default([])
}).refine(
  (data) => {
    if (data.allDay) return true
    const start = new Date(`${data.startDate}T${data.startTime}`)
    const end = new Date(`${data.endDate}T${data.endTime}`)
    return end > start
  },
  {
    message: "La date de fin doit être après la date de début",
    path: ["endTime"],
  }
)

// Type exports
export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>
export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>
export type UpdateAthleteProfileInput = z.infer<typeof updateAthleteProfileSchema>
export type NoteFormInput = z.infer<typeof noteFormSchema>
export type RecommendationFormInput = z.infer<typeof recommendationFormSchema>
export type AthleteProfileFormInput = z.infer<typeof athleteProfileFormSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type CreateParticipantInput = z.infer<typeof createParticipantSchema>
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>
export type EventFormInput = z.infer<typeof eventFormSchema>