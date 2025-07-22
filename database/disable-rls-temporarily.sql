-- Désactiver temporairement RLS pour déboguer
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_participants DISABLE ROW LEVEL SECURITY;