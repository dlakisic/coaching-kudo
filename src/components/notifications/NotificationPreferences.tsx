'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'

interface NotificationPreferences {
  training_reminders: boolean
  motivation_messages: boolean
  social_notifications: boolean
  task_reminders: boolean
  emergency_alerts: boolean
  reminder_before_training_hours: number
  reminder_before_training_minutes: number
  quiet_hours_start: string
  quiet_hours_end: string
  weekend_notifications: boolean
  motivation_frequency: number
}

const defaultPreferences: NotificationPreferences = {
  training_reminders: true,
  motivation_messages: true,
  social_notifications: true,
  task_reminders: true,
  emergency_alerts: true,
  reminder_before_training_hours: 2,
  reminder_before_training_minutes: 30,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  weekend_notifications: true,
  motivation_frequency: 3
}

export default function NotificationPreferences() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClientComponentClient()
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Charger les préférences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          setPreferences({
            training_reminders: data.training_reminders,
            motivation_messages: data.motivation_messages,
            social_notifications: data.social_notifications,
            task_reminders: data.task_reminders,
            emergency_alerts: data.emergency_alerts,
            reminder_before_training_hours: data.reminder_before_training_hours,
            reminder_before_training_minutes: data.reminder_before_training_minutes,
            quiet_hours_start: data.quiet_hours_start,
            quiet_hours_end: data.quiet_hours_end,
            weekend_notifications: data.weekend_notifications,
            motivation_frequency: data.motivation_frequency
          })
        }
      } catch (err) {
        console.error('Erreur chargement préférences:', err)
        setError('Erreur lors du chargement des préférences')
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [supabase])

  // Sauvegarder les préférences
  const savePreferences = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K, 
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          ⚙️ Préférences de notifications
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Personnalisez vos notifications selon vos préférences
        </p>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">⚠️ {error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">✅ Préférences sauvegardées</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Types de notifications */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Types de notifications
          </h4>
          <div className="space-y-3">
            {[
              { key: 'training_reminders', label: '🥋 Rappels d\'entraînement', desc: 'Notifications avant vos séances' },
              { key: 'motivation_messages', label: '💪 Messages motivationnels', desc: 'Encouragements et félicitations' },
              { key: 'social_notifications', label: '👥 Activité sociale', desc: 'Commentaires et interactions' },
              { key: 'task_reminders', label: '📝 Rappels de tâches', desc: 'Noter vos séances, objectifs' },
              { key: 'emergency_alerts', label: '⚠️ Alertes urgentes', desc: 'Annulations, changements importants' }
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[key as keyof NotificationPreferences] as boolean}
                  onChange={(e) => updatePreference(key as keyof NotificationPreferences, e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {label}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Timing des rappels */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Timing des rappels
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Heures avant entraînement
              </label>
              <select
                value={preferences.reminder_before_training_hours}
                onChange={(e) => updatePreference('reminder_before_training_hours', parseInt(e.target.value))}
                className={`w-full p-2 border rounded-md text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={1}>1 heure</option>
                <option value={2}>2 heures</option>
                <option value={4}>4 heures</option>
                <option value={24}>1 jour</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Minutes avant entraînement
              </label>
              <select
                value={preferences.reminder_before_training_minutes}
                onChange={(e) => updatePreference('reminder_before_training_minutes', parseInt(e.target.value))}
                className={`w-full p-2 border rounded-md text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 heure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Heures de silence */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            🌙 Heures de silence
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Début
              </label>
              <input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                className={`w-full p-2 border rounded-md text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fin
              </label>
              <input
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                className={`w-full p-2 border rounded-md text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Options supplémentaires */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Options supplémentaires
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.weekend_notifications}
                onChange={(e) => updatePreference('weekend_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                📅 Notifications le weekend
              </span>
            </label>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                🎯 Fréquence des messages motivationnels
              </label>
              <select
                value={preferences.motivation_frequency}
                onChange={(e) => updatePreference('motivation_frequency', parseInt(e.target.value))}
                className={`w-full max-w-xs p-2 border rounded-md text-sm ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={1}>Rare</option>
                <option value={2}>Normal</option>
                <option value={3}>Fréquent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder les préférences'}
        </button>
      </div>
    </div>
  )
}