import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecommendationsService } from '@/services/RecommendationsService'
import { recommendationFormSchema, type RecommendationFormInput } from '@/schemas'
import { RecommendationPriority } from '@/constants'

interface UseRecommendationFormProps {
  athleteId: string
  coachId: string
  onSuccess?: () => void
}

export function useRecommendationForm({ athleteId, coachId, onSuccess }: UseRecommendationFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<RecommendationPriority>('moyenne')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const router = useRouter()

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('moyenne')
    setMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validation côté client
      const formData: RecommendationFormInput = {
        athleteId,
        title,
        description,
        priority
      }

      const validatedData = recommendationFormSchema.parse(formData)

      // Appeler le service
      await RecommendationsService.create({
        athlete_id: validatedData.athleteId,
        coach_id: coachId,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        read_status: false
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
    title,
    description,
    priority,
    loading,
    message,
    
    // Setters
    setTitle,
    setDescription,
    setPriority,
    
    // Actions
    handleSubmit,
    resetForm
  }
}