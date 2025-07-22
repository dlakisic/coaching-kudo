-- Réactiver RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_participants ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Enable read access for coaches" ON calendar_events;
DROP POLICY IF EXISTS "Enable read access for athletes on public events" ON calendar_events;
DROP POLICY IF EXISTS "Enable read access for participants" ON calendar_events;
DROP POLICY IF EXISTS "Coaches can create events" ON calendar_events;
DROP POLICY IF EXISTS "Coaches can update own events" ON calendar_events;
DROP POLICY IF EXISTS "Coaches can delete own events" ON calendar_events;

DROP POLICY IF EXISTS "Enable read for event organizers" ON calendar_event_participants;
DROP POLICY IF EXISTS "Enable read for participants" ON calendar_event_participants;
DROP POLICY IF EXISTS "Organizers can manage participants" ON calendar_event_participants;
DROP POLICY IF EXISTS "Participants can update own status" ON calendar_event_participants;

-- Politiques très simples pour calendar_events
CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT
USING (true); -- Temporairement, tout le monde peut lire

CREATE POLICY "calendar_events_insert" ON calendar_events FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "calendar_events_update" ON calendar_events FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "calendar_events_delete" ON calendar_events FOR DELETE
USING (auth.uid() = organizer_id);

-- Politiques très simples pour calendar_event_participants
CREATE POLICY "participants_select" ON calendar_event_participants FOR SELECT
USING (true); -- Temporairement, tout le monde peut lire

CREATE POLICY "participants_insert" ON calendar_event_participants FOR INSERT
WITH CHECK (true); -- Les organisateurs géreront via l'app

CREATE POLICY "participants_update" ON calendar_event_participants FOR UPDATE
USING (true); -- Les organisateurs et participants géreront via l'app

CREATE POLICY "participants_delete" ON calendar_event_participants FOR DELETE
USING (true); -- Les organisateurs géreront via l'app