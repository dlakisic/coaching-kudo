-- Création des tables pour l'application Coaching Kudo

-- Table des profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('coach', 'athlete')),
  category VARCHAR(100),
  grade VARCHAR(100),
  weight DECIMAL(5,2),
  height INTEGER, -- Taille en cm
  active BOOLEAN DEFAULT false,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des notes d'entraînement
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('technique', 'mental', 'physique', 'tactique')),
  content TEXT NOT NULL,
  date DATE NOT NULL,
  context VARCHAR(20) NOT NULL CHECK (context IN ('entrainement', 'competition')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des recommandations
CREATE TABLE recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
  read_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_notes_coach_id ON notes(coach_id);
CREATE INDEX idx_notes_athlete_id ON notes(athlete_id);
CREATE INDEX idx_notes_date ON notes(date);
CREATE INDEX idx_recommendations_coach_id ON recommendations(coach_id);
CREATE INDEX idx_recommendations_athlete_id ON recommendations(athlete_id);
CREATE INDEX idx_recommendations_read_status ON recommendations(read_status);

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Politiques pour les profils
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Les coaches peuvent voir tous les profils d'athlètes" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'coach' AND active = true
    )
  );

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Les nouveaux utilisateurs peuvent créer leur profil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour les notes
CREATE POLICY "Les coaches peuvent créer des notes" ON notes
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id AND
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach' AND active = true)
  );

CREATE POLICY "Les coaches peuvent voir leurs notes" ON notes
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Les athlètes peuvent voir leurs notes" ON notes
  FOR SELECT USING (auth.uid() = athlete_id);

-- Politiques pour les recommandations
CREATE POLICY "Les coaches peuvent créer des recommandations" ON recommendations
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id AND
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach' AND active = true)
  );

CREATE POLICY "Les coaches peuvent voir leurs recommandations" ON recommendations
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Les athlètes peuvent voir leurs recommandations" ON recommendations
  FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY "Les athlètes peuvent marquer les recommandations comme lues" ON recommendations
  FOR UPDATE USING (auth.uid() = athlete_id)
  WITH CHECK (auth.uid() = athlete_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();