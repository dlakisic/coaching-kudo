-- Script pour déboguer les politiques RLS
-- À exécuter dans le SQL Editor de Supabase

-- 1. Lister toutes les politiques sur la table profiles
SELECT 
  policyname as "Nom Politique",
  cmd as "Commande",
  qual as "Condition",
  with_check as "Avec Vérification"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Vérifier le statut RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Activé"
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Tester la récursion en simulant une requête
-- (Cette requête peut échouer si il y a récursion)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, email, role 
FROM profiles 
WHERE id = '5e9e7093-5c0b-4cd4-905f-dff6beccc8af'::uuid;

-- 4. Vérifier les dépendances entre politiques
SELECT DISTINCT
  p1.policyname as "Politique 1",
  p2.policyname as "Politique 2"
FROM pg_policies p1, pg_policies p2
WHERE p1.tablename = 'profiles' 
  AND p2.tablename = 'profiles'
  AND p1.policyname != p2.policyname
  AND p1.qual ILIKE '%profiles%'
  AND p2.qual ILIKE '%profiles%';

-- 5. Essayer de créer une politique simple et safe
-- Commençons par supprimer toutes les politiques
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON profiles';
        RAISE NOTICE 'Supprimée: %', policy_record.policyname;
    END LOOP;
END $$;

-- 6. Créer une politique de base ultra-simple
CREATE POLICY "basic_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 7. Tester si ça marche
SELECT 'Test de la nouvelle politique:' as info;
SELECT id, email FROM profiles WHERE id = auth.uid() LIMIT 1;