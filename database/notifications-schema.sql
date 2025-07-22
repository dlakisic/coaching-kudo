-- ==================================================
-- SCHEMA NOTIFICATIONS PUSH - COACHING KUDO
-- ==================================================

-- Table pour stocker les subscriptions push des utilisateurs
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL, -- Clé publique pour le chiffrement
  auth TEXT NOT NULL,   -- Clé d'authentification
  user_agent TEXT,     -- Pour identifier l'appareil/navigateur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Contrainte unique : un utilisateur peut avoir plusieurs devices mais pas le même endpoint
  UNIQUE(user_id, endpoint)
);

-- Table pour les préférences de notifications par utilisateur
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Types de notifications activées
  training_reminders BOOLEAN DEFAULT true,
  motivation_messages BOOLEAN DEFAULT true,
  social_notifications BOOLEAN DEFAULT true,
  task_reminders BOOLEAN DEFAULT true,
  emergency_alerts BOOLEAN DEFAULT true,
  
  -- Timing des notifications
  reminder_before_training_hours INTEGER DEFAULT 2, -- Heures avant entraînement
  reminder_before_training_minutes INTEGER DEFAULT 30, -- Minutes avant entraînement
  quiet_hours_start TIME DEFAULT '22:00'::TIME, -- Début période silencieuse
  quiet_hours_end TIME DEFAULT '08:00'::TIME,   -- Fin période silencieuse
  weekend_notifications BOOLEAN DEFAULT true,
  
  -- Fréquence des notifications motivationnelles
  motivation_frequency INTEGER DEFAULT 3, -- 1=rare, 2=normal, 3=fréquent
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id)
);

-- Table pour les logs des notifications envoyées
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id), -- Coach qui a envoyé (NULL si automatique)
  recipient_count INTEGER NOT NULL DEFAULT 0,
  notification_type VARCHAR(50) NOT NULL, -- 'training', 'motivation', 'social', etc.
  payload JSONB NOT NULL, -- Contenu complet de la notification
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Index pour les recherches rapides
  CHECK (recipient_count >= 0),
  CHECK (success_count >= 0),
  CHECK (failed_count >= 0),
  CHECK (success_count + failed_count <= recipient_count)
);

-- Table pour tracker les interactions avec les notifications
CREATE TABLE IF NOT EXISTS notification_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_log_id UUID REFERENCES notification_logs(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'opened', 'clicked', 'dismissed', 'action_completed'
  action_data JSONB, -- Données additionnelles selon l'action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  device_info TEXT -- User agent pour analytics
);

-- Table pour la queue des notifications à envoyer (traitement asynchrone)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_ids UUID[] NOT NULL, -- Array des IDs utilisateurs ciblés
  notification_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL, -- Quand l'envoyer
  created_by UUID REFERENCES auth.users(id),
  priority INTEGER DEFAULT 1, -- 1=normal, 2=high, 3=urgent
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CHECK (priority BETWEEN 1 AND 3),
  CHECK (attempts <= max_attempts),
  CHECK (status IN ('pending', 'processing', 'sent', 'failed'))
);

-- ==================================================
-- INDEX POUR LA PERFORMANCE
-- ==================================================

-- Index pour les subscriptions actives d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active 
ON push_subscriptions(user_id) WHERE is_active = true;

-- Index pour rechercher par endpoint
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON push_subscriptions(endpoint);

-- Index pour les notifications à traiter
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending 
ON notification_queue(scheduled_for, priority) WHERE status = 'pending';

-- Index pour les logs par type et date
CREATE INDEX IF NOT EXISTS idx_notification_logs_type_date 
ON notification_logs(notification_type, sent_at DESC);

-- Index pour les interactions utilisateur
CREATE INDEX IF NOT EXISTS idx_notification_interactions_user_type 
ON notification_interactions(user_id, notification_type, created_at DESC);

-- ==================================================
-- ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Activer RLS sur toutes les tables
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Politique pour push_subscriptions : utilisateurs voient uniquement leurs subscriptions
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Politique pour notification_preferences : utilisateurs gèrent leurs préférences
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Politique pour notification_logs : coaches voient leurs envois, utilisateurs voient ce qui les concerne
CREATE POLICY "Coaches can view their sent notifications" ON notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'coach'
      AND (sender_id = auth.uid() OR sender_id IS NULL)
    )
  );

-- Politique pour notification_interactions : utilisateurs voient leurs interactions
CREATE POLICY "Users can view own notification interactions" ON notification_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification interactions" ON notification_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour notification_queue : coaches peuvent créer, service workers lisent tout
CREATE POLICY "Coaches can create notification queue items" ON notification_queue
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'coach'
    )
  );

-- Politique pour les service workers (via service role)
CREATE POLICY "Service role can manage notification queue" ON notification_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ==================================================
-- FONCTIONS UTILITAIRES
-- ==================================================

-- Fonction pour nettoyer les anciennes subscriptions inactives
CREATE OR REPLACE FUNCTION cleanup_inactive_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM push_subscriptions 
  WHERE is_active = false 
  AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les subscriptions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_subscriptions(target_user_id UUID)
RETURNS TABLE (
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.endpoint, ps.p256dh, ps.auth
  FROM push_subscriptions ps
  WHERE ps.user_id = target_user_id 
  AND ps.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les tables nécessaires
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- DONNÉES INITIALES
-- ==================================================

-- Créer les préférences par défaut pour les utilisateurs existants
INSERT INTO notification_preferences (user_id)
SELECT DISTINCT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Fonction pour créer automatiquement les préférences lors de la création d'un profil
CREATE OR REPLACE FUNCTION create_notification_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les préférences automatiquement
CREATE TRIGGER create_notification_preferences_on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_notification_preferences_for_new_user();

COMMENT ON TABLE push_subscriptions IS 'Stockage des subscriptions push pour les notifications Web Push API';
COMMENT ON TABLE notification_preferences IS 'Préférences de notifications par utilisateur';
COMMENT ON TABLE notification_logs IS 'Journal des notifications envoyées pour analytics';
COMMENT ON TABLE notification_interactions IS 'Tracking des interactions utilisateur avec les notifications';
COMMENT ON TABLE notification_queue IS 'Queue pour le traitement asynchrone des notifications';