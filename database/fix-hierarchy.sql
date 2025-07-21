-- Fix pour la contrainte de hiérarchie

-- 1. D'abord, supprimer la contrainte temporairement
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_coach_hierarchy;

-- 2. Créer le type ENUM s'il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coach_level_enum') THEN
        CREATE TYPE coach_level_enum AS ENUM ('super_admin', 'principal', 'junior');
    END IF;
END $$;

-- 3. Ajouter la colonne coach_level si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'coach_level') THEN
        ALTER TABLE profiles ADD COLUMN coach_level coach_level_enum DEFAULT NULL;
    END IF;
END $$;

-- 4. Ajouter la colonne managed_by si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'managed_by') THEN
        ALTER TABLE profiles ADD COLUMN managed_by UUID REFERENCES profiles(id);
    END IF;
END $$;

-- 5. Mettre à jour les coaches existants avec un niveau par défaut
UPDATE profiles 
SET coach_level = 'super_admin' 
WHERE role = 'coach' AND coach_level IS NULL;

-- 6. Remettre la contrainte (maintenant les données sont conformes)
ALTER TABLE profiles ADD CONSTRAINT check_coach_hierarchy 
  CHECK (
    (role = 'coach' AND coach_level IS NOT NULL) OR 
    (role = 'athlete' AND coach_level IS NULL)
  );

-- 7. Ajouter le flag is_super_admin s'il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_super_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 8. Marquer les coaches existants comme super_admin
UPDATE profiles 
SET is_super_admin = true 
WHERE role = 'coach' AND coach_level = 'super_admin';