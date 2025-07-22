'use client'

import { useState } from 'react'
import Link from 'next/link'
import QuickFormModal from '@/components/modals/QuickFormModal'

interface Recommendation {
  id: string
  title: string
  description: string
  priority: string
  read_status: boolean
  coach: { name: string }
}

interface RecommendationsSectionProps {
  recommendations: Recommendation[]
  unreadCount: number
  athleteId: string
  athleteName: string
  coachId: string
  isCoach: boolean
}

export default function RecommendationsSection({ 
  recommendations, 
  unreadCount, 
  athleteId, 
  athleteName, 
  coachId, 
  isCoach 
}: RecommendationsSectionProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recommandations</h2>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} non lues
            </span>
          )}
          {isCoach && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
              title="Créer une recommandation"
            >
              <span>➕</span>
              <span className="hidden sm:inline">Nouvelle</span>
            </button>
          )}
        </div>
      </div>
      
      {recommendations && recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.slice(0, 3).map((recommendation) => (
            <div key={recommendation.id} className={`p-3 rounded-md border ${
              !recommendation.read_status ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-900">{recommendation.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    recommendation.priority === 'haute' ? 'bg-red-100 text-red-800' :
                    recommendation.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {recommendation.priority}
                  </span>
                  {!recommendation.read_status && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{recommendation.description}</p>
            </div>
          ))}
          {recommendations.length > 3 && (
            <Link
              href={`/recommendations?athleteId=${athleteId}`}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              Voir toutes les recommandations ({recommendations.length})
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-3">Aucune recommandation pour cet athlète</p>
          {isCoach && (
            <button
              onClick={() => setShowModal(true)}
              className="text-green-600 text-sm hover:text-green-800 font-medium"
            >
              Créer la première recommandation
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
          type="recommendation"
        />
      )}
    </div>
  )
}