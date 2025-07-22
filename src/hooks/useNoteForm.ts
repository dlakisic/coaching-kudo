import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotesService } from '@/services/NotesService'
import { noteFormSchema, type NoteFormInput } from '@/schemas'
import { NoteCategory, NoteContext } from '@/constants'

interface UseNoteFormProps {
  athleteId: string
  coachId: string
  onSuccess?: () => void
}

export function useNoteForm({ athleteId, coachId, onSuccess }: UseNoteFormProps) {
  const [category, setCategory] = useState<NoteCategory>('technique')
  const [context, setContext] = useState<NoteContext>('entrainement')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const router = useRouter()

  const resetForm = () => {
    setContent('')
    setMessage('')
    setCategory('technique')
    setContext('entrainement')
    setDate(new Date().toISOString().split('T')[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validation côté client
      const formData: NoteFormInput = {
        athleteId,
        category,
        context,
        date,
        content
      }

      const validatedData = noteFormSchema.parse(formData)

      // Appeler le service
      await NotesService.create({
        athlete_id: validatedData.athleteId,
        coach_id: coachId,
        category: validatedData.category,
        context: validatedData.context,
        date: validatedData.date,
        content: validatedData.content
      })

      resetForm()
      onSuccess?.()
      router.refresh()
    } catch (error: any) {
      if (error.errors) {
        // Erreurs de validation Zod
        const firstError = error.errors[0]
        setMessage(firstError.message)
      } else {
        // Erreurs du service
        setMessage(error.message || 'Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    category,
    context,
    date,
    content,
    loading,
    message,
    
    // Setters
    setCategory,
    setContext,
    setDate,
    setContent,
    
    // Actions
    handleSubmit,
    resetForm
  }
}