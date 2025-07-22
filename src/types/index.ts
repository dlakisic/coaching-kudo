export interface Profile {
  id: string
  email: string
  name: string
  role: 'coach' | 'athlete'
  category?: string
  grade?: string
  weight?: number
  height?: number
  active: boolean
  photo?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  coach_id: string
  athlete_id: string
  category: 'technique' | 'mental' | 'physique' | 'tactique'
  content: string
  date: string
  context: 'entrainement' | 'competition'
  created_at: string
}

export interface Recommendation {
  id: string
  coach_id: string
  athlete_id: string
  title: string
  description: string
  priority: 'haute' | 'moyenne' | 'basse'
  read_status: boolean
  created_at: string
  updated_at: string
}