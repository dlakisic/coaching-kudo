'use client'

import Modal from '@/components/ui/Modal'
import NoteForm from './forms/NoteForm'
import RecommendationForm from './forms/RecommendationForm'

type FormType = 'note' | 'recommendation'

interface QuickFormModalProps {
  isOpen: boolean
  onClose: () => void
  athleteId: string
  athleteName: string
  coachId: string
  type: FormType
}

export default function QuickFormModal({ isOpen, onClose, athleteId, athleteName, coachId, type }: QuickFormModalProps) {
  const config = {
    note: {
      title: `Nouvelle note pour ${athleteName}`
    },
    recommendation: {
      title: `Nouvelle recommandation pour ${athleteName}`
    }
  }

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config[type].title}
    >
      {type === 'note' ? (
        <NoteForm
          athleteId={athleteId}
          coachId={coachId}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      ) : (
        <RecommendationForm
          athleteId={athleteId}
          coachId={coachId}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      )}
    </Modal>
  )
}