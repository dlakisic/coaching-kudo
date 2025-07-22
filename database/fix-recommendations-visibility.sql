-- Correction: Les coaches seniors doivent voir les recommandations de leurs juniors

-- 1. Supprimer l'ancienne politique pour les recommandations
DROP POLICY IF EXISTS "Coaches voient recommandations selon hiérarchie" ON recommendations;

-- 2. Nouvelle politique plus permissive pour les recommendations
CREATE POLICY "Coaches voient recommandations hiérarchiques" ON recommendations
  FOR SELECT USING (
    -- Le coach qui a créé la recommandation
    auth.uid() = coach_id
    OR
    -- Super admin voit toutes les recommandations
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'super_admin'
    )
    OR
    -- Coach principal voit les recommandations de ses juniors
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    ) AND coach_id IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND managed_by = auth.uid()
    ))
    OR
    -- Coach principal peut aussi voir toutes les recommandations (supervision générale)
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    )
  );

-- 3. Même correction pour les notes
DROP POLICY IF EXISTS "Coaches voient notes selon hiérarchie" ON notes;

CREATE POLICY "Coaches voient notes hiérarchiques" ON notes
  FOR SELECT USING (
    -- Le coach qui a écrit la note
    auth.uid() = coach_id
    OR
    -- Super admin voit toutes les notes
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'super_admin'
    )
    OR
    -- Coach principal voit les notes de ses juniors
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    ) AND coach_id IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND managed_by = auth.uid()
    ))
    OR
    -- Coach principal peut aussi voir toutes les notes (supervision générale)
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    )
  );

-- 4. Politique pour permettre aux coaches seniors de modifier les recommandations des juniors
CREATE POLICY "Coaches seniors modifient recommandations juniors" ON recommendations
  FOR UPDATE USING (
    -- Le coach qui a créé la recommandation peut la modifier
    auth.uid() = coach_id
    OR
    -- Super admin peut modifier toutes les recommandations
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'super_admin'
    )
    OR
    -- Coach principal peut modifier les recommandations de ses juniors
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    ) AND coach_id IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND managed_by = auth.uid()
    ))
  );

-- 5. Politique pour permettre aux coaches seniors de modifier les notes des juniors
CREATE POLICY "Coaches seniors modifient notes juniors" ON notes
  FOR UPDATE USING (
    -- Le coach qui a créé la note peut la modifier
    auth.uid() = coach_id
    OR
    -- Super admin peut modifier toutes les notes
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'super_admin'
    )
    OR
    -- Coach principal peut modifier les notes de ses juniors
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    ) AND coach_id IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND managed_by = auth.uid()
    ))
  );

-- 6. Vue améliorée pour voir toutes les recommandations avec info hiérarchique
CREATE OR REPLACE VIEW recommendations_hierarchy_view AS
SELECT 
  r.*,
  c.name as coach_name,
  c.coach_level,
  a.name as athlete_name,
  a.category as athlete_category,
  CASE 
    WHEN c.managed_by IS NOT NULL THEN 
      (SELECT name FROM profiles WHERE id = c.managed_by)
    ELSE 'Indépendant'
  END as supervisor_name,
  CASE 
    WHEN r.read_status THEN 'Lu'
    ELSE 'Non lu'
  END as status_text
FROM recommendations r
JOIN profiles c ON r.coach_id = c.id
JOIN profiles a ON r.athlete_id = a.id
ORDER BY r.created_at DESC;

-- 7. Vue pour les notes avec info hiérarchique
CREATE OR REPLACE VIEW notes_hierarchy_view AS
SELECT 
  n.*,
  c.name as coach_name,
  c.coach_level,
  a.name as athlete_name,
  a.category as athlete_category,
  CASE 
    WHEN c.managed_by IS NOT NULL THEN 
      (SELECT name FROM profiles WHERE id = c.managed_by)
    ELSE 'Indépendant'
  END as supervisor_name
FROM notes n
JOIN profiles c ON n.coach_id = c.id
JOIN profiles a ON n.athlete_id = a.id
ORDER BY n.date DESC, n.created_at DESC;

-- 8. Fonction pour obtenir toutes les recommandations visibles par un coach
CREATE OR REPLACE FUNCTION get_visible_recommendations(p_coach_id UUID)
RETURNS TABLE(
  recommendation_id UUID,
  title VARCHAR(255),
  athlete_name VARCHAR(255),
  created_by_coach VARCHAR(255),
  priority VARCHAR(10),
  created_at TIMESTAMPTZ,
  is_own BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as recommendation_id,
    r.title,
    a.name as athlete_name,
    c.name as created_by_coach,
    r.priority,
    r.created_at,
    (r.coach_id = p_coach_id) as is_own
  FROM recommendations r
  JOIN profiles c ON r.coach_id = c.id
  JOIN profiles a ON r.athlete_id = a.id
  WHERE (
    -- Ses propres recommandations
    r.coach_id = p_coach_id
    OR
    -- Si c'est un super admin, voir toutes
    p_coach_id IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'super_admin'
    )
    OR
    -- Si c'est un coach principal, voir celles de ses juniors
    (p_coach_id IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    ) AND r.coach_id IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND managed_by = p_coach_id
    ))
  )
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Test de la fonction (remplacez l'UUID par celui de votre coach principal)
-- SELECT * FROM get_visible_recommendations('UUID_DU_COACH_PRINCIPAL');

SELECT 'Permissions mises à jour: Les coaches seniors peuvent maintenant voir et modifier les recommandations/notes de leurs juniors' as status;