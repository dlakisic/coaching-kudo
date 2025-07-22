'use client'

import { useState } from 'react'
import Link from 'next/link'
import QuickFormModal from '@/components/modals/QuickFormModal'

interface Note {
  id: string
  category: string
  context: string
  date: string
  content: string
  coach: { name: string }
}

interface NotesSectionProps {
  notes: Note[]
  athleteId: string
  athleteName: string
  coachId: string
  isCoach: boolean
}

export default function NotesSection({ 
  notes, 
  athleteId, 
  athleteName, 
  coachId, 
  isCoach 
}: NotesSectionProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
        <div className="flex items-center space-x-2">
          {isCoach && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
              title="Ajouter une note"
            >
              <span>➕</span>
              <span className="hidden sm:inline">Nouvelle</span>
            </button>
          )}
          <Link
            href={`/notes?athleteId=${athleteId}`}
            className="text-blue-600 text-sm hover:text-blue-800 font-medium"
          >
            Voir toutes
          </Link>
        </div>
      </div>
      
      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    note.category === 'technique' ? 'bg-blue-100 text-blue-800' :
                    note.category === 'mental' ? 'bg-purple-100 text-purple-800' :
                    note.category === 'physique' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {note.category}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    note.context === 'competition' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {note.context}
                  </span>
                </div>
                <time className="text-xs text-gray-500">
                  {new Date(note.date).toLocaleDateString('fr-FR')}
                </time>
              </div>
              <p className="text-sm text-gray-900">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-3">Aucune note pour cet athlète</p>
          {isCoach && (
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 text-sm hover:text-blue-800 font-medium"
            >
              Créer la première note
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <QuickFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          athleteId={athleteId}
          athleteName={athleteName}
          coachId={coachId}
          type="note"
        />
      )}
    </div>
  )
}