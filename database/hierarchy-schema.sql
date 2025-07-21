-- Système hiérarchique de coaches

-- 1. Ajouter les niveaux hiérarchiques
ALTER TABLE profiles ADD COLUMN coach_level INTEGER DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN managed_by UUID REFERENCES profiles(id); -- Coach parent

-- 2. Créer un type ENUM pour les niveaux
CREATE TYPE coach_level_enum AS ENUM ('super_admin', 'principal', 'junior');

-- 3. Mettre à jour la structure
ALTER TABLE profiles DROP COLUMN IF EXISTS coach_level;
ALTER TABLE profiles ADD COLUMN coach_level coach_level_enum DEFAULT NULL;

-- 4. Contraintes logiques
ALTER TABLE profiles ADD CONSTRAINT check_coach_hierarchy 
  CHECK (
    (role = 'coach' AND coach_level IS NOT NULL) OR 
    (role = 'athlete' AND coach_level IS NULL)
  );

-- 5. Table des permissions hiérarchiques
CREATE TABLE coach_hierarchy (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_coach_id, child_coach_id)
);

-- 6. Index pour les requêtes hiérarchiques
CREATE INDEX idx_hierarchy_parent ON coach_hierarchy(parent_coach_id);
CREATE INDEX idx_hierarchy_child ON coach_hierarchy(child_coach_id);
CREATE INDEX idx_profiles_managed_by ON profiles(managed_by);

-- 7. Politique RLS pour la hiérarchie
ALTER TABLE coach_hierarchy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their hierarchy" ON coach_hierarchy
  FOR SELECT USING (
    parent_coach_id = auth.uid() OR child_coach_id = auth.uid()
  );

-- 8. Fonction pour créer un coach junior
CREATE OR REPLACE FUNCTION create_junior_coach(
  p_athlete_id UUID,
  p_coach_level coach_level_enum DEFAULT 'junior',
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
DECLARE
  v_creator_level coach_level_enum;
  v_creator_role VARCHAR(20);
BEGIN
  -- Récupérer les infos du créateur
  SELECT role, coach_level INTO v_creator_role, v_creator_level
  FROM profiles WHERE id = p_created_by;

  -- Vérifications des permissions
  IF v_creator_role != 'coach' THEN
    RAISE EXCEPTION 'Seuls les coaches peuvent créer d''autres coaches';
  END IF;

  -- Super admin peut tout faire
  IF v_creator_level = 'super_admin' THEN
    -- OK, peut créer n'importe quel niveau
  ELSIF v_creator_level = 'principal' AND p_coach_level = 'junior' THEN
    -- Coach principal peut créer des juniors
  ELSE
    RAISE EXCEPTION 'Permissions insuffisantes pour créer ce niveau de coach';
  END IF;

  -- Vérifier que l'athlète existe et est actif
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_athlete_id AND role = 'athlete' AND active = true
  ) THEN
    RAISE EXCEPTION 'Athlète invalide ou inactif';
  END IF;

  -- Promouvoir l'athlète en coach
  UPDATE profiles 
  SET 
    role = 'coach',
    coach_level = p_coach_level,
    managed_by = p_created_by,
    updated_at = NOW()
  WHERE id = p_athlete_id;

  -- Créer la relation hiérarchique si ce n'est pas un super admin
  IF p_coach_level != 'super_admin' THEN
    INSERT INTO coach_hierarchy (parent_coach_id, child_coach_id, created_by)
    VALUES (p_created_by, p_athlete_id, p_created_by)
    ON CONFLICT (parent_coach_id, child_coach_id) DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Fonction pour vérifier les permissions d'assignment
CREATE OR REPLACE FUNCTION can_assign_athlete(
  p_coach_id UUID,
  p_athlete_id UUID,
  p_assigner_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_assigner_level coach_level_enum;
  v_target_coach_managed_by UUID;
BEGIN
  -- Récupérer le niveau de l'assigneur
  SELECT coach_level INTO v_assigner_level
  FROM profiles WHERE id = p_assigner_id AND role = 'coach';

  -- Super admin peut tout assigner
  IF v_assigner_level = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Coach principal peut assigner à ses coaches juniors
  IF v_assigner_level = 'principal' THEN
    SELECT managed_by INTO v_target_coach_managed_by
    FROM profiles WHERE id = p_coach_id AND role = 'coach';
    
    RETURN v_target_coach_managed_by = p_assigner_id;
  END IF;

  -- Coach junior ne peut assigner qu'à lui-même
  IF v_assigner_level = 'junior' THEN
    RETURN p_coach_id = p_assigner_id;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Mettre à jour la fonction d'assignment avec la hiérarchie
CREATE OR REPLACE FUNCTION assign_coach_to_athlete_hierarchical(
  p_coach_id UUID,
  p_athlete_id UUID,
  p_assigned_by UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier les permissions hiérarchiques
  IF NOT can_assign_athlete(p_coach_id, p_athlete_id, p_assigned_by) THEN
    RAISE EXCEPTION 'Permissions insuffisantes pour cette assignment';
  END IF;

  -- Vérifier que l'athlète existe et est actif  
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_athlete_id AND role = 'athlete' AND active = true
  ) THEN
    RAISE EXCEPTION 'Athlète invalide ou inactif';
  END IF;

  -- Créer l'assignment
  INSERT INTO coach_athlete_assignments (coach_id, athlete_id, assigned_by)
  VALUES (p_coach_id, p_athlete_id, p_assigned_by)
  ON CONFLICT (coach_id, athlete_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Vue pour simplifier les requêtes hiérarchiques
CREATE OR REPLACE VIEW coach_hierarchy_view AS
WITH RECURSIVE hierarchy AS (
  -- Base: Super admins
  SELECT 
    id,
    name,
    coach_level,
    managed_by,
    ARRAY[id] as path,
    0 as depth,
    id as root_id
  FROM profiles 
  WHERE role = 'coach' AND coach_level = 'super_admin'
  
  UNION ALL
  
  -- Récursif: Enfants
  SELECT 
    p.id,
    p.name,
    p.coach_level,
    p.managed_by,
    h.path || p.id,
    h.depth + 1,
    h.root_id
  FROM profiles p
  JOIN hierarchy h ON p.managed_by = h.id
  WHERE p.role = 'coach'
)
SELECT * FROM hierarchy;