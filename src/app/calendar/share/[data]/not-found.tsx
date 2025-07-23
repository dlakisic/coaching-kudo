export default function SharedEventNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-6xl mb-4">❌</div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Événement non trouvé
          </h1>
          
          <p className="text-gray-600 mb-6">
            Le lien que vous avez suivi semble être invalide ou expiré. 
            L'événement partagé n'existe plus ou n'a jamais existé.
          </p>
          
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🏠 Retour à l'accueil
            </a>
            
            <a
              href="/calendar"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              📅 Voir le calendrier
            </a>
          </div>
          
          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            <strong>💡 Conseil :</strong> Vérifiez que vous avez copié le lien complet 
            ou demandez à la personne qui l'a partagé de vous renvoyer le lien.
          </div>
        </div>
      </div>
    </div>
  )
}