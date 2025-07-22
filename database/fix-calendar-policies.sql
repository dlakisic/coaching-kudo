-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Coaches can view events" ON calendar_events;
DROP POLICY IF EXISTS "Athletes can view relevant events" ON calendar_events;
DROP POLICY IF EXISTS "Coaches can create events" ON calendar_events;
DROP POLICY IF EXISTS "Coaches can update own events" ON calendar_events;
DROP POLICY IF EXISTS "Coaches can delete own events" ON calendar_events;

DROP POLICY IF EXISTS "View event participants" ON calendar_event_participants;
DROP POLICY IF EXISTS "Coaches can add participants" ON calendar_event_participants;
DROP POLICY IF EXISTS "Coaches can update participants" ON calendar_event_participants;
DROP POLICY IF EXISTS "Participants can update own status" ON calendar_event_participants;
DROP POLICY IF EXISTS "Coaches can remove participants" ON calendar_event_participants;

-- Politiques simplifiées pour calendar_events
CREATE POLICY "Enable read access for coaches" ON calendar_events FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'coach'
));

CREATE POLICY "Enable read access for athletes on public events" ON calendar_events FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'athlete') 
  AND visibility = 'public'
);

CREATE POLICY "Enable read access for participants" ON calendar_events FOR SELECT
USING (
  auth.uid() IN (
    SELECT participant_id FROM calendar_event_participants WHERE event_id = calendar_events.id
  )
);

CREATE POLICY "Coaches can create events" ON calendar_events FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach')
  AND organizer_id = auth.uid()
);

CREATE POLICY "Coaches can update own events" ON calendar_events FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach')
  AND organizer_id = auth.uid()
);

CREATE POLICY "Coaches can delete own events" ON calendar_events FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach')
  AND organizer_id = auth.uid()
);

-- Politiques simplifiées pour calendar_event_participants
CREATE POLICY "Enable read for event organizers" ON calendar_event_participants FOR SELECT
USING (
  auth.uid() IN (
    SELECT organizer_id FROM calendar_events WHERE id = event_id
  )
);

CREATE POLICY "Enable read for participants" ON calendar_event_participants FOR SELECT
USING (participant_id = auth.uid());

CREATE POLICY "Organizers can manage participants" ON calendar_event_participants FOR ALL
USING (
  auth.uid() IN (
    SELECT organizer_id FROM calendar_events WHERE id = event_id
  )
);

CREATE POLICY "Participants can update own status" ON calendar_event_participants FOR UPDATE
USING (participant_id = auth.uid())
WITH CHECK (participant_id = auth.uid());