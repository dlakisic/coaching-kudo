-- Liste les politiques RLS sur profiles
SELECT 
  policyname as "Nom",
  cmd as "Commande", 
  qual as "Condition"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;