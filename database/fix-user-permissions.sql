-- Mettre à jour le rôle de l'utilisateur dino@lakisic.dev en coach
UPDATE profiles 
SET role = 'coach' 
WHERE email = 'dino@lakisic.dev';

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Coaches can create events" ON calendar_events;

-- Créer de nouvelles politiques qui permettent aux athlètes de créer certains événements
CREATE POLICY "Coaches can create all events" ON calendar_events FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach')
  AND organizer_id = auth.uid()
);

CREATE POLICY "Athletes can create personal events" ON calendar_events FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'athlete')
  AND organizer_id = auth.uid()
  AND event_type IN ('training', 'personal', 'other')
);

-- Politique de mise à jour : les utilisateurs peuvent modifier leurs propres événements
DROP POLICY IF EXISTS "Coaches can update own events" ON calendar_events;

CREATE POLICY "Users can update own events" ON calendar_events FOR UPDATE
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- Politique de suppression : les utilisateurs peuvent supprimer leurs propres événements
DROP POLICY IF EXISTS "Coaches can delete own events" ON calendar_events;

CREATE POLICY "Users can delete own events" ON calendar_events FOR DELETE
USING (organizer_id = auth.uid());

-- Vérifier le résultat
SELECT id, email, name, role FROM profiles WHERE email = 'dino@lakisic.dev';