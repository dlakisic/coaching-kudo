-- Créer un profil pour dino@lakisic.dev

-- 1. D'abord, vérifier si l'utilisateur existe dans auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'dino@lakisic.dev';

-- 2. Créer le profil (remplacez par Super Admin pour avoir tous les droits)
INSERT INTO profiles (
  id, 
  email, 
  name, 
  role, 
  coach_level, 
  category, 
  grade, 
  active
) 
SELECT 
  id,
  'dino@lakisic.dev',
  'Dino Lakisic',
  'coach',
  'super_admin',
  '+270',
  '5e kyu',
  true
FROM auth.users 
WHERE email = 'dino@lakisic.dev'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  coach_level = EXCLUDED.coach_level,
  category = EXCLUDED.category,
  grade = EXCLUDED.grade,
  active = EXCLUDED.active;

-- 3. Vérifier que le profil a été créé
SELECT * FROM profiles WHERE email = 'dino@lakisic.dev';

-- 4. Afficher un résumé
SELECT 
  'Profil créé avec succès pour Dino!' as status,
  name,
  role,
  coach_level,
  active
FROM profiles 
WHERE email = 'dino@lakisic.dev';