-- Ajout du système d'assignment coach-athlète

-- 1. Table des assignments
CREATE TABLE coach_athlete_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id), -- Qui a fait l'assignment (admin)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, athlete_id) -- Évite les doublons
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX idx_assignments_coach_id ON coach_athlete_assignments(coach_id);
CREATE INDEX idx_assignments_athlete_id ON coach_athlete_assignments(athlete_id);

-- 3. Ajouter un flag super_admin pour gérer les assignments
ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- 4. Politique RLS pour les assignments
ALTER TABLE coach_athlete_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their assignments" ON coach_athlete_assignments
  FOR SELECT USING (
    coach_id = auth.uid() OR athlete_id = auth.uid()
  );

CREATE POLICY "Super admins can manage assignments" ON coach_athlete_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- 5. Mettre à jour les politiques pour les notes (filtrer par assignment)
DROP POLICY IF EXISTS "Authenticated users can manage notes" ON notes;

CREATE POLICY "Coaches can manage notes for assigned athletes" ON notes
  FOR INSERT WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coach_athlete_assignments 
      WHERE coach_id = auth.uid() AND athlete_id = notes.athlete_id
    )
  );

CREATE POLICY "Coaches can view notes for assigned athletes" ON notes
  FOR SELECT USING (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coach_athlete_assignments 
      WHERE coach_id = auth.uid() AND athlete_id = notes.athlete_id
    )
    OR athlete_id = auth.uid()
  );

-- 6. Mettre à jour les politiques pour les recommandations
DROP POLICY IF EXISTS "Authenticated users can manage recommendations" ON recommendations;

CREATE POLICY "Coaches can manage recommendations for assigned athletes" ON recommendations
  FOR INSERT WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coach_athlete_assignments 
      WHERE coach_id = auth.uid() AND athlete_id = recommendations.athlete_id
    )
  );

CREATE POLICY "Coaches can view recommendations for assigned athletes" ON recommendations
  FOR SELECT USING (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coach_athlete_assignments 
      WHERE coach_id = auth.uid() AND athlete_id = recommendations.athlete_id
    )
    OR athlete_id = auth.uid()
  );

CREATE POLICY "Athletes can update read status of their recommendations" ON recommendations
  FOR UPDATE USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- 7. Fonction pour assigner un coach à un athlète
CREATE OR REPLACE FUNCTION assign_coach_to_athlete(
  p_coach_id UUID,
  p_athlete_id UUID,
  p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier que l'assigneur est super admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_assigned_by AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Seuls les super admins peuvent faire des assignments';
  END IF;

  -- Vérifier que le coach existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_coach_id AND role = 'coach' AND active = true
  ) THEN
    RAISE EXCEPTION 'Coach invalide ou inactif';
  END IF;

  -- Vérifier que l'athlète existe et est actif  
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_athlete_id AND role = 'athlete' AND active = true
  ) THEN
    RAISE EXCEPTION 'Athlète invalide ou inactif';
  END IF;

  -- Créer l'assignment (ON CONFLICT DO NOTHING évite les doublons)
  INSERT INTO coach_athlete_assignments (coach_id, athlete_id, assigned_by)
  VALUES (p_coach_id, p_athlete_id, p_assigned_by)
  ON CONFLICT (coach_id, athlete_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;