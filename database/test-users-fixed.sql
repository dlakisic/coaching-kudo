-- Utilisateurs de test pour l'application Coaching Kudo
-- IMPORTANT: Ce script doit être exécuté en 2 étapes:
-- 1. D'abord créer les utilisateurs d'authentification via l'interface Supabase Auth
-- 2. Puis exécuter ce script pour créer les profils

-- ÉTAPE 1: Créer ces utilisateurs via l'interface Supabase Auth (Authentication > Users > Invite user)
-- Emails à créer:
-- admin@coaching-kudo.com
-- principal@coaching-kudo.com  
-- coach1@coaching-kudo.com
-- coach2@coaching-kudo.com
-- athlete1@test.com
-- athlete2@test.com
-- athlete3@test.com
-- athlete4@test.com
-- athlete5@test.com
-- athlete6@test.com

-- ÉTAPE 2: Exécuter ce script après avoir créé les utilisateurs d'authentification

-- Fonction pour obtenir l'ID utilisateur par email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur avec email % non trouvé dans auth.users', user_email;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- 1. Super Admin Coach
INSERT INTO profiles (
  id, 
  email, 
  name, 
  role, 
  coach_level, 
  category, 
  grade, 
  active
) VALUES (
  get_user_id_by_email('admin@coaching-kudo.com'),
  'admin@coaching-kudo.com',
  'Alexandre Dubois',
  'coach',
  'super_admin',
  'Senior',
  'Dan 5',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  coach_level = EXCLUDED.coach_level,
  category = EXCLUDED.category,
  grade = EXCLUDED.grade,
  active = EXCLUDED.active;

-- 2. Coach Principal
INSERT INTO profiles (
  id, 
  email, 
  name, 
  role, 
  coach_level, 
  category, 
  grade, 
  active,
  managed_by
) VALUES (
  get_user_id_by_email('principal@coaching-kudo.com'),
  'principal@coaching-kudo.com',
  'Marie Laurent',
  'coach',
  'principal',
  'Senior',
  'Dan 3',
  true,
  get_user_id_by_email('admin@coaching-kudo.com')
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  coach_level = EXCLUDED.coach_level,
  category = EXCLUDED.category,
  grade = EXCLUDED.grade,
  active = EXCLUDED.active,
  managed_by = EXCLUDED.managed_by;

-- 3. Coach Junior 1
INSERT INTO profiles (
  id, 
  email, 
  name, 
  role, 
  coach_level, 
  category, 
  grade, 
  active,
  managed_by
) VALUES (
  get_user_id_by_email('coach1@coaching-kudo.com'),
  'coach1@coaching-kudo.com',
  'Pierre Martin',
  'coach',
  'junior',
  'Senior',
  'Dan 1',
  true,
  get_user_id_by_email('principal@coaching-kudo.com')
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  coach_level = EXCLUDED.coach_level,
  category = EXCLUDED.category,
  grade = EXCLUDED.grade,
  active = EXCLUDED.active,
  managed_by = EXCLUDED.managed_by;

-- 4. Coach Junior 2
INSERT INTO profiles (
  id, 
  email, 
  name, 
  role, 
  coach_level, 
  category, 
  grade, 
  active,
  managed_by
) VALUES (
  get_user_id_by_email('coach2@coaching-kudo.com'),
  'coach2@coaching-kudo.com',
  'Sophie Bernard',
  'coach',
  'junior',
  'Senior',
  'Dan 2',
  true,
  get_user_id_by_email('principal@coaching-kudo.com')
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  coach_level = EXCLUDED.coach_level,
  category = EXCLUDED.category,
  grade = EXCLUDED.grade,
  active = EXCLUDED.active,
  managed_by = EXCLUDED.managed_by;

-- 5-10. Athlètes de test
INSERT INTO profiles (id, email, name, role, category, grade, weight, height, active) VALUES 
-- Athlète 1
(
  get_user_id_by_email('athlete1@test.com'),
  'athlete1@test.com',
  'Lucas Moreau',
  'athlete',
  'Junior -60kg',
  'Kyu 2',
  58.5,
  172,
  true
),
-- Athlète 2
(
  get_user_id_by_email('athlete2@test.com'),
  'athlete2@test.com',
  'Emma Rousseau',
  'athlete',
  'Junior -55kg',
  'Kyu 1',
  54.2,
  165,
  true
),
-- Athlète 3
(
  get_user_id_by_email('athlete3@test.com'),
  'athlete3@test.com',
  'Thomas Leroy',
  'athlete',
  'Senior -70kg',
  'Dan 1',
  68.7,
  178,
  true
),
-- Athlète 4
(
  get_user_id_by_email('athlete4@test.com'),
  'athlete4@test.com',
  'Camille Dupont',
  'athlete',
  'Senior -65kg',
  'Kyu 1',
  63.1,
  170,
  true
),
-- Athlète 5
(
  get_user_id_by_email('athlete5@test.com'),
  'athlete5@test.com',
  'Antoine Garcia',
  'athlete',
  'Junior -65kg',
  'Kyu 3',
  62.8,
  175,
  true
),
-- Athlète 6
(
  get_user_id_by_email('athlete6@test.com'),
  'athlete6@test.com',
  'Léa Petit',
  'athlete',
  'Junior -50kg',
  'Kyu 2',
  49.3,
  160,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  category = EXCLUDED.category,
  grade = EXCLUDED.grade,
  weight = EXCLUDED.weight,
  height = EXCLUDED.height,
  active = EXCLUDED.active;

-- Créer les relations hiérarchiques entre coaches
INSERT INTO coach_hierarchy (parent_coach_id, child_coach_id, created_by)
VALUES 
(
  get_user_id_by_email('admin@coaching-kudo.com'),
  get_user_id_by_email('principal@coaching-kudo.com'),
  get_user_id_by_email('admin@coaching-kudo.com')
),
(
  get_user_id_by_email('principal@coaching-kudo.com'),
  get_user_id_by_email('coach1@coaching-kudo.com'),
  get_user_id_by_email('principal@coaching-kudo.com')
),
(
  get_user_id_by_email('principal@coaching-kudo.com'),
  get_user_id_by_email('coach2@coaching-kudo.com'),
  get_user_id_by_email('principal@coaching-kudo.com')
)
ON CONFLICT (parent_coach_id, child_coach_id) DO NOTHING;

-- Créer quelques notes de test
INSERT INTO notes (coach_id, athlete_id, category, content, date, context)
VALUES 
(
  get_user_id_by_email('coach1@coaching-kudo.com'),
  get_user_id_by_email('athlete1@test.com'),
  'technique',
  'Excellente progression sur les techniques de jambe. Continue à travailler la flexibilité.',
  CURRENT_DATE - INTERVAL '2 days',
  'entrainement'
),
(
  get_user_id_by_email('coach1@coaching-kudo.com'),
  get_user_id_by_email('athlete2@test.com'),
  'mental',
  'Bon contrôle du stress pendant les randoris. À maintenir en compétition.',
  CURRENT_DATE - INTERVAL '1 day',
  'entrainement'
),
(
  get_user_id_by_email('coach2@coaching-kudo.com'),
  get_user_id_by_email('athlete3@test.com'),
  'physique',
  'Cardio en progression. Augmenter l''intensité des exercices de musculation.',
  CURRENT_DATE,
  'entrainement'
);

-- Créer quelques recommandations de test
INSERT INTO recommendations (coach_id, athlete_id, title, description, priority)
VALUES 
(
  get_user_id_by_email('coach1@coaching-kudo.com'),
  get_user_id_by_email('athlete1@test.com'),
  'Améliorer la condition physique',
  'Augmenter les séances de cardio à 3x par semaine pour améliorer l''endurance.',
  'haute'
),
(
  get_user_id_by_email('coach2@coaching-kudo.com'),
  get_user_id_by_email('athlete3@test.com'),
  'Travailler les chutes',
  'Perfectionner les ukemis arrière pour une meilleure sécurité.',
  'moyenne'
),
(
  get_user_id_by_email('coach1@coaching-kudo.com'),
  get_user_id_by_email('athlete2@test.com'),
  'Technique de frappe',
  'Améliorer la précision des coups de poing lors des kata.',
  'basse'
);

-- Nettoyer la fonction temporaire
DROP FUNCTION get_user_id_by_email(TEXT);

-- Afficher un résumé des données créées
SELECT 
  'RÉSUMÉ DES UTILISATEURS CRÉÉS:' as info;

SELECT 
  role,
  coach_level,
  COUNT(*) as nombre,
  STRING_AGG(name, ', ') as noms
FROM profiles 
GROUP BY role, coach_level
ORDER BY role DESC, coach_level;

SELECT 
  'Notes créées:' as info,
  COUNT(*) as nombre
FROM notes;

SELECT 
  'Recommandations créées:' as info,
  COUNT(*) as nombre  
FROM recommendations;

SELECT 
  'Relations hiérarchiques:' as info,
  COUNT(*) as nombre
FROM coach_hierarchy;