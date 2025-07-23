-- Extension du schéma pour l'intégration Google Calendar

-- Table pour stocker les tokens d'accès Google Calendar
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Table pour l'historique des synchronisations
CREATE TABLE IF NOT EXISTS google_calendar_syncs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter des colonnes à la table calendar_events pour les événements externes
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_link TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'; -- 'manual', 'google_calendar', etc.

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON calendar_events(external_id, organizer_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source);
CREATE INDEX IF NOT EXISTS idx_google_calendar_syncs_user_id ON google_calendar_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_syncs_synced_at ON google_calendar_syncs(synced_at);

-- RLS Policies
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_syncs ENABLE ROW LEVEL SECURITY;

-- Politique pour les tokens Google Calendar (utilisateur ne voit que ses tokens)
CREATE POLICY "Users can manage their own Google Calendar tokens" ON google_calendar_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Politique pour l'historique de sync (utilisateur ne voit que son historique)
CREATE POLICY "Users can view their own sync history" ON google_calendar_syncs
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own sync history" ON google_calendar_syncs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonction pour nettoyer les anciens tokens expirés (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION cleanup_expired_google_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM google_calendar_tokens 
  WHERE expires_at < NOW() - INTERVAL '30 days' 
    AND refresh_token IS NULL;
    
  -- Nettoyer aussi l'historique de sync ancien (garder 3 mois)
  DELETE FROM google_calendar_syncs 
  WHERE synced_at < NOW() - INTERVAL '3 months';
END;
$$;

-- Commentaires pour la documentation
COMMENT ON TABLE google_calendar_tokens IS 'Stockage des tokens d''accès Google Calendar pour chaque utilisateur';
COMMENT ON TABLE google_calendar_syncs IS 'Historique des synchronisations avec Google Calendar';
COMMENT ON COLUMN calendar_events.external_id IS 'ID de l''événement dans le système externe (Google Calendar, etc.)';
COMMENT ON COLUMN calendar_events.external_link IS 'Lien vers l''événement dans le système externe';
COMMENT ON COLUMN calendar_events.source IS 'Source de l''événement: manual, google_calendar, etc.';

-- Vue pour les statistiques de synchronisation
CREATE OR REPLACE VIEW google_calendar_sync_stats AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  COUNT(s.id) as total_syncs,
  MAX(s.synced_at) as last_sync,
  SUM(s.imported_count) as total_imported,
  SUM(s.updated_count) as total_updated,
  SUM(s.error_count) as total_errors,
  CASE 
    WHEN t.expires_at > NOW() THEN 'connected'
    WHEN t.expires_at IS NOT NULL THEN 'expired'
    ELSE 'not_connected'
  END as connection_status
FROM profiles u
LEFT JOIN google_calendar_syncs s ON u.id = s.user_id
LEFT JOIN google_calendar_tokens t ON u.id = t.user_id
WHERE u.role IN ('coach', 'athlete')
GROUP BY u.id, u.name, t.expires_at;