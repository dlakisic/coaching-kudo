-- Visibilité bidirectionnelle: Les coaches juniors voient aussi les recos des seniors

-- 1. Supprimer les politiques actuelles pour les recommandations
DROP POLICY IF EXISTS "Coaches voient recommandations hiérarchiques" ON recommendations;

-- 2. Nouvelle politique avec visibilité bidirectionnelle pour les recommandations
CREATE POLICY "Coaches visibilité bidirectionnelle recommandations" ON recommendations
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
    -- Coach principal voit toutes les recommandations (les siennes + de ses juniors)
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    )
    OR
    -- Coach junior voit ses propres recommandations + celles de son superviseur
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'junior'
    ) AND coach_id IN (
      -- Ses propres recos (déjà couvert ci-dessus)
      -- + Recos de son coach principal superviseur
      SELECT managed_by FROM profiles WHERE id = auth.uid() AND managed_by IS NOT NULL
      UNION
      -- + Recos des super admins
      SELECT id FROM profiles WHERE role = 'coach' AND coach_level = 'super_admin'
    ))
  );

-- 3. Même logique pour les notes
DROP POLICY IF EXISTS "Coaches voient notes hiérarchiques" ON notes;

CREATE POLICY "Coaches visibilité bidirectionnelle notes" ON notes
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
    -- Coach principal voit toutes les notes
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    )
    OR
    -- Coach junior voit ses notes + celles de son superviseur
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'junior'
    ) AND coach_id IN (
      -- Notes de son coach principal superviseur
      SELECT managed_by FROM profiles WHERE id = auth.uid() AND managed_by IS NOT NULL
      UNION
      -- Notes des super admins
      SELECT id FROM profiles WHERE role = 'coach' AND coach_level = 'super_admin'
    ))
  );

-- 4. Politique de modification: seuls les seniors peuvent modifier le contenu des juniors
-- (les juniors ne peuvent pas modifier le contenu de leurs superviseurs)
DROP POLICY IF EXISTS "Coaches seniors modifient recommandations juniors" ON recommendations;

CREATE POLICY "Modification hiérarchique recommandations" ON recommendations
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

-- 5. Même logique pour les notes
DROP POLICY IF EXISTS "Coaches seniors modifient notes juniors" ON notes;

CREATE POLICY "Modification hiérarchique notes" ON notes
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

-- 6. Fonction pour obtenir toutes les recommandations visibles avec indication de source
CREATE OR REPLACE FUNCTION get_coach_recommendations_with_source(p_coach_id UUID)
RETURNS TABLE(
  recommendation_id UUID,
  title VARCHAR(255),
  description TEXT,
  athlete_name VARCHAR(255),
  created_by_coach VARCHAR(255),
  coach_level coach_level_enum,
  priority VARCHAR(10),
  created_at TIMESTAMPTZ,
  source_type TEXT,
  can_modify BOOLEAN
) AS $$
DECLARE
  v_coach_level coach_level_enum;
BEGIN
  -- Récupérer le niveau du coach connecté
  SELECT coach_level INTO v_coach_level
  FROM profiles WHERE id = p_coach_id AND role = 'coach';

  RETURN QUERY
  SELECT 
    r.id as recommendation_id,
    r.title,
    r.description,
    a.name as athlete_name,
    c.name as created_by_coach,
    c.coach_level,
    r.priority,
    r.created_at,
    CASE 
      WHEN r.coach_id = p_coach_id THEN 'Mes recommandations'
      WHEN c.coach_level = 'super_admin' THEN 'Direction générale'
      WHEN c.id = (SELECT managed_by FROM profiles WHERE id = p_coach_id) THEN 'Mon superviseur'
      WHEN c.managed_by = p_coach_id THEN 'Mon équipe'
      ELSE 'Autre coach'
    END as source_type,
    CASE 
      -- Peut modifier ses propres recos
      WHEN r.coach_id = p_coach_id THEN TRUE
      -- Super admin peut modifier toutes
      WHEN v_coach_level = 'super_admin' THEN TRUE
      -- Coach principal peut modifier celles de ses juniors
      WHEN v_coach_level = 'principal' AND c.managed_by = p_coach_id THEN TRUE
      ELSE FALSE
    END as can_modify
  FROM recommendations r
  JOIN profiles c ON r.coach_id = c.id
  JOIN profiles a ON r.athlete_id = a.id
  WHERE (
    -- Ses propres recommandations
    r.coach_id = p_coach_id
    OR
    -- Si c'est un super admin, voir toutes
    v_coach_level = 'super_admin'
    OR
    -- Si c'est un coach principal, voir toutes
    v_coach_level = 'principal'
    OR
    -- Si c'est un coach junior, voir celles de ses superviseurs
    (v_coach_level = 'junior' AND r.coach_id IN (
      -- Son superviseur direct
      SELECT managed_by FROM profiles WHERE id = p_coach_id AND managed_by IS NOT NULL
      UNION
      -- Les super admins
      SELECT id FROM profiles WHERE role = 'coach' AND coach_level = 'super_admin'
    ))
  )
  ORDER BY 
    CASE 
      WHEN r.coach_id = p_coach_id THEN 1  -- Ses recos en premier
      WHEN c.coach_level = 'super_admin' THEN 2  -- Puis direction
      WHEN c.id = (SELECT managed_by FROM profiles WHERE id = p_coach_id) THEN 3  -- Puis superviseur
      ELSE 4  -- Puis le reste
    END,
    r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Vue simplifiée pour l'interface utilisateur
CREATE OR REPLACE VIEW coach_dashboard_recommendations AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.priority,
  r.created_at,
  a.name as athlete_name,
  c.name as coach_name,
  c.coach_level,
  CASE 
    WHEN c.coach_level = 'super_admin' THEN 'Direction'
    WHEN c.coach_level = 'principal' THEN 'Supervision'
    WHEN c.coach_level = 'junior' THEN 'Terrain'
  END as level_display,
  r.read_status
FROM recommendations r
JOIN profiles c ON r.coach_id = c.id
JOIN profiles a ON r.athlete_id = a.id
ORDER BY 
  CASE 
    WHEN c.coach_level = 'super_admin' THEN 1
    WHEN c.coach_level = 'principal' THEN 2
    WHEN c.coach_level = 'junior' THEN 3
  END,
  r.created_at DESC;

-- 8. Test et affichage du résumé
SELECT 'NOUVELLE VISIBILITÉ BIDIRECTIONNELLE:' as info;

SELECT 
  coach_level,
  'Peut voir:' as permission_type,
  CASE 
    WHEN coach_level = 'super_admin' THEN 'Toutes les recommandations et notes'
    WHEN coach_level = 'principal' THEN 'Toutes les recommandations et notes (supervision complète)'
    WHEN coach_level = 'junior' THEN 'Ses propres recommandations + celles de son superviseur et des super admins'
  END as description
FROM (VALUES 
  ('super_admin'::coach_level_enum),
  ('principal'::coach_level_enum),
  ('junior'::coach_level_enum)
) as levels(coach_level);

SELECT 
  coach_level,
  'Peut modifier:' as permission_type,
  CASE 
    WHEN coach_level = 'super_admin' THEN 'Toutes les recommandations et notes'
    WHEN coach_level = 'principal' THEN 'Ses propres + celles de ses coaches juniors'
    WHEN coach_level = 'junior' THEN 'Seulement ses propres recommandations et notes'
  END as description
FROM (VALUES 
  ('super_admin'::coach_level_enum),
  ('principal'::coach_level_enum),
  ('junior'::coach_level_enum)
) as levels(coach_level);