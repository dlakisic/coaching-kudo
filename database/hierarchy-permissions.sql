-- Amélioration des permissions hiérarchiques
-- Les niveaux supérieurs doivent voir tous les niveaux inférieurs

-- 1. Supprimer les anciennes politiques pour les recréer
DROP POLICY IF EXISTS "Les coaches peuvent voir tous les profils d'athlètes" ON profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON profiles;

-- 2. Fonction pour vérifier la hiérarchie (récursive)
CREATE OR REPLACE FUNCTION is_coach_superior_or_equal(
  p_coach_id UUID,
  p_target_id UUID
)
RETURNS BOOLEAN AS $$
WITH RECURSIVE hierarchy_check AS (
  -- Base case: même personne
  SELECT p_target_id as coach_id, 0 as level
  WHERE p_coach_id = p_target_id
  
  UNION ALL
  
  -- Recursive case: remonter la hiérarchie
  SELECT p.managed_by as coach_id, hc.level + 1
  FROM profiles p
  JOIN hierarchy_check hc ON p.id = hc.coach_id
  WHERE p.managed_by IS NOT NULL
    AND hc.level < 10 -- Éviter les boucles infinies
)
SELECT EXISTS (
  SELECT 1 FROM hierarchy_check 
  WHERE coach_id = p_coach_id
);
$$ LANGUAGE sql STABLE;

-- 3. Fonction pour obtenir tous les coaches sous un coach donné
CREATE OR REPLACE FUNCTION get_subordinate_coaches(p_coach_id UUID)
RETURNS TABLE(subordinate_id UUID) AS $$
WITH RECURSIVE subordinates AS (
  -- Base: le coach lui-même
  SELECT id FROM profiles WHERE id = p_coach_id AND role = 'coach'
  
  UNION ALL
  
  -- Récursif: tous ses subordonnés
  SELECT p.id
  FROM profiles p
  JOIN subordinates s ON p.managed_by = s.id
  WHERE p.role = 'coach'
)
SELECT id FROM subordinates;
$$ LANGUAGE sql STABLE;

-- 4. Nouvelles politiques pour les profils
CREATE POLICY "Utilisateurs voient leur profil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Coaches voient leur hiérarchie descendante" ON profiles
  FOR SELECT USING (
    -- Super admin voit tout
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'super_admin'
    ))
    OR
    -- Coach principal voit ses juniors et leurs athlètes
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'principal'
    ) AND (
      -- Voir les coaches juniors sous sa responsabilité
      (role = 'coach' AND managed_by = auth.uid())
      OR
      -- Voir tous les athlètes
      role = 'athlete'
    ))
    OR
    -- Coach junior voit uniquement les athlètes (pas d'autres coaches)
    (auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role = 'coach' AND coach_level = 'junior'
    ) AND role = 'athlete')
  );

-- 5. Mettre à jour les politiques pour les notes
DROP POLICY IF EXISTS "Les coaches peuvent voir leurs notes" ON notes;
DROP POLICY IF EXISTS "Les athlètes peuvent voir leurs notes" ON notes;

CREATE POLICY "Coaches voient notes selon hiérarchie" ON notes
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
  );

CREATE POLICY "Athlètes voient leurs notes" ON notes
  FOR SELECT USING (auth.uid() = athlete_id);

-- 6. Mettre à jour les politiques pour les recommandations
DROP POLICY IF EXISTS "Les coaches peuvent voir leurs recommandations" ON recommendations;
DROP POLICY IF EXISTS "Les athlètes peuvent voir leurs recommandations" ON recommendations;

CREATE POLICY "Coaches voient recommandations selon hiérarchie" ON recommendations
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
  );

CREATE POLICY "Athlètes voient leurs recommandations" ON recommendations
  FOR SELECT USING (auth.uid() = athlete_id);

-- 7. Politique pour les assignments coach-athlète (si la table existe)
-- CREATE POLICY "Coaches voient assignments selon hiérarchie" ON coach_athlete_assignments
--   FOR SELECT USING (
--     -- Le coach assigné
--     auth.uid() = coach_id
--     OR
--     -- Super admin voit tous les assignments
--     auth.uid() IN (
--       SELECT id FROM profiles 
--       WHERE role = 'coach' AND coach_level = 'super_admin'
--     )
--     OR
--     -- Coach principal voit les assignments de ses juniors
--     (auth.uid() IN (
--       SELECT id FROM profiles 
--       WHERE role = 'coach' AND coach_level = 'principal'
--     ) AND coach_id IN (
--       SELECT id FROM profiles 
--       WHERE role = 'coach' AND managed_by = auth.uid()
--     ))
--   );

-- 8. Fonction pour vérifier les droits de création de notes/recommandations
CREATE OR REPLACE FUNCTION can_create_content_for_athlete(
  p_coach_id UUID,
  p_athlete_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_coach_level coach_level_enum;
BEGIN
  -- Récupérer le niveau du coach
  SELECT coach_level INTO v_coach_level
  FROM profiles WHERE id = p_coach_id AND role = 'coach';

  -- Super admin peut tout faire
  IF v_coach_level = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Coach principal peut créer du contenu pour tous les athlètes
  IF v_coach_level = 'principal' THEN
    RETURN EXISTS (
      SELECT 1 FROM profiles WHERE id = p_athlete_id AND role = 'athlete'
    );
  END IF;

  -- Coach junior peut créer du contenu uniquement pour ses athlètes assignés
  -- (nécessite une table d'assignments ou une logique d'assignment)
  IF v_coach_level = 'junior' THEN
    -- Pour l'instant, permettre à tous les coaches juniors de créer du contenu
    -- À ajuster selon votre logique d'assignment
    RETURN EXISTS (
      SELECT 1 FROM profiles WHERE id = p_athlete_id AND role = 'athlete'
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 9. Mettre à jour les politiques de création
DROP POLICY IF EXISTS "Les coaches peuvent créer des notes" ON notes;
CREATE POLICY "Coaches créent notes selon permissions" ON notes
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id 
    AND can_create_content_for_athlete(coach_id, athlete_id)
  );

DROP POLICY IF EXISTS "Les coaches peuvent créer des recommandations" ON recommendations;
CREATE POLICY "Coaches créent recommandations selon permissions" ON recommendations
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id 
    AND can_create_content_for_athlete(coach_id, athlete_id)
  );

-- 10. Vue pour faciliter l'affichage hiérarchique dans l'interface
CREATE OR REPLACE VIEW coach_athletes_view AS
SELECT DISTINCT
  c.id as coach_id,
  c.name as coach_name,
  c.coach_level,
  a.id as athlete_id,
  a.name as athlete_name,
  a.category as athlete_category,
  a.grade as athlete_grade,
  CASE 
    WHEN c.coach_level = 'super_admin' THEN 'Supervision complète'
    WHEN c.coach_level = 'principal' THEN 'Supervision étendue'  
    WHEN c.coach_level = 'junior' THEN 'Supervision directe'
  END as supervision_type
FROM profiles c
CROSS JOIN profiles a
WHERE c.role = 'coach' 
  AND a.role = 'athlete'
  AND (
    -- Super admin voit tous les athlètes
    c.coach_level = 'super_admin'
    OR
    -- Coach principal voit tous les athlètes
    c.coach_level = 'principal'
    OR
    -- Coach junior voit tous les athlètes (à affiner selon votre logique)
    c.coach_level = 'junior'
  );

-- Afficher un résumé des permissions
SELECT 
  'RÉSUMÉ DES PERMISSIONS HIÉRARCHIQUES:' as info;

SELECT 
  coach_level,
  'Peut voir:' as permission_type,
  CASE 
    WHEN coach_level = 'super_admin' THEN 'Tous les coaches et athlètes'
    WHEN coach_level = 'principal' THEN 'Coaches juniors sous sa responsabilité + tous les athlètes'
    WHEN coach_level = 'junior' THEN 'Tous les athlètes uniquement'
  END as description
FROM (VALUES 
  ('super_admin'::coach_level_enum),
  ('principal'::coach_level_enum),
  ('junior'::coach_level_enum)
) as levels(coach_level);