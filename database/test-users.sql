-- Utilisateurs de test pour l'application Coaching Kudo
-- À exécuter dans la console SQL de Supabase

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
  gen_random_uuid(),
  'admin@coaching-kudo.com',
  'Alexandre Dubois',
  'coach',
  'super_admin',
  'Senior',
  'Dan 5',
  true
);

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
  gen_random_uuid(),
  'principal@coaching-kudo.com',
  'Marie Laurent',
  'coach',
  'principal',
  'Senior',
  'Dan 3',
  true,
  (SELECT id FROM profiles WHERE email = 'admin@coaching-kudo.com')
);

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
  gen_random_uuid(),
  'coach1@coaching-kudo.com',
  'Pierre Martin',
  'coach',
  'junior',
  'Senior',
  'Dan 1',
  true,
  (SELECT id FROM profiles WHERE email = 'principal@coaching-kudo.com')
);

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
  gen_random_uuid(),
  'coach2@coaching-kudo.com',
  'Sophie Bernard',
  'coach',
  'junior',
  'Senior',
  'Dan 2',
  true,
  (SELECT id FROM profiles WHERE email = 'principal@coaching-kudo.com')
);

-- 5-10. Athlètes de test
INSERT INTO profiles (
  id, 
  email, 
  name, 
  role, 
  category, 
  grade, 
  weight, 
  height, 
  active
) VALUES 
-- Athlète 1
(
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
  'athlete6@test.com',
  'Léa Petit',
  'athlete',
  'Junior -50kg',
  'Kyu 2',
  49.3,
  160,
  true
);

-- Créer les relations hiérarchiques entre coaches
INSERT INTO coach_hierarchy (parent_coach_id, child_coach_id, created_by)
SELECT 
  admin.id as parent_coach_id,
  principal.id as child_coach_id,
  admin.id as created_by
FROM 
  (SELECT id FROM profiles WHERE email = 'admin@coaching-kudo.com') admin,
  (SELECT id FROM profiles WHERE email = 'principal@coaching-kudo.com') principal;

INSERT INTO coach_hierarchy (parent_coach_id, child_coach_id, created_by)
SELECT 
  principal.id as parent_coach_id,
  junior.id as child_coach_id,
  principal.id as created_by
FROM 
  (SELECT id FROM profiles WHERE email = 'principal@coaching-kudo.com') principal,
  profiles junior
WHERE junior.email IN ('coach1@coaching-kudo.com', 'coach2@coaching-kudo.com');

-- Créer quelques assignments coach-athlète (table à créer si elle n'existe pas)
-- INSERT INTO coach_athlete_assignments (coach_id, athlete_id, assigned_by)
-- SELECT 
--   coach.id,
--   athlete.id,
--   admin.id
-- FROM 
--   profiles coach,
--   profiles athlete,
--   (SELECT id FROM profiles WHERE email = 'admin@coaching-kudo.com') admin
-- WHERE 
--   coach.email = 'coach1@coaching-kudo.com' 
--   AND athlete.email IN ('athlete1@test.com', 'athlete2@test.com');

-- Créer quelques notes de test
INSERT INTO notes (coach_id, athlete_id, category, content, date, context)
SELECT 
  coach.id,
  athlete.id,
  'technique',
  'Excellente progression sur les techniques de jambe. Continue à travailler la flexibilité.',
  CURRENT_DATE - INTERVAL '2 days',
  'entrainement'
FROM 
  profiles coach,
  profiles athlete
WHERE 
  coach.email = 'coach1@coaching-kudo.com' 
  AND athlete.email = 'athlete1@test.com';

INSERT INTO notes (coach_id, athlete_id, category, content, date, context)
SELECT 
  coach.id,
  athlete.id,
  'mental',
  'Bon contrôle du stress pendant les randoris. À maintenir en compétition.',
  CURRENT_DATE - INTERVAL '1 day',
  'entrainement'
FROM 
  profiles coach,
  profiles athlete
WHERE 
  coach.email = 'coach1@coaching-kudo.com' 
  AND athlete.email = 'athlete2@test.com';

-- Créer quelques recommandations de test
INSERT INTO recommendations (coach_id, athlete_id, title, description, priority)
SELECT 
  coach.id,
  athlete.id,
  'Améliorer la condition physique',
  'Augmenter les séances de cardio à 3x par semaine pour améliorer l''endurance.',
  'haute'
FROM 
  profiles coach,
  profiles athlete
WHERE 
  coach.email = 'coach1@coaching-kudo.com' 
  AND athlete.email = 'athlete1@test.com';

INSERT INTO recommendations (coach_id, athlete_id, title, description, priority)
SELECT 
  coach.id,
  athlete.id,
  'Travailler les chutes',
  'Perfectionner les ukemis arrière pour une meilleure sécurité.',
  'moyenne'
FROM 
  profiles coach,
  profiles athlete
WHERE 
  coach.email = 'coach2@coaching-kudo.com' 
  AND athlete.email = 'athlete3@test.com';

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
ORDER BY role, coach_level;

SELECT 
  'Notes créées:' as info,
  COUNT(*) as nombre
FROM notes;

SELECT 
  'Recommandations créées:' as info,
  COUNT(*) as nombre  
FROM recommendations;