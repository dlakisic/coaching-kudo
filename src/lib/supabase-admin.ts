import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

// Client admin avec service role key - BYPASS RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Types pour les opérations admin
export type AdminUser = {
  id: string
  email: string
  name: string
  role: 'coach' | 'athlete'
  coach_level?: 'super_admin' | 'principal' | 'junior'
  active: boolean
  managed_by?: string
  created_at: string
  updated_at: string
}

// Fonctions admin sécurisées
export class AdminService {
  
  // Récupérer un profil par ID (avec vérification des permissions)
  static async getProfile(userId: string, requesterId: string): Promise<AdminUser | null> {
    const { data: requester } = await supabaseAdmin
      .from('profiles')
      .select('role, coach_level')
      .eq('id', requesterId)
      .single()

    if (!requester) return null

    // Super admin peut voir tout
    if (requester.coach_level === 'super_admin') {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data
    }

    // Autres utilisateurs ne voient que leur propre profil (pour l'instant)
    if (userId === requesterId) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data
    }

    return null
  }

  // Récupérer tous les profils visibles par un utilisateur
  static async getVisibleProfiles(requesterId: string): Promise<AdminUser[]> {
    const { data: requester } = await supabaseAdmin
      .from('profiles')
      .select('role, coach_level')
      .eq('id', requesterId)
      .single()

    if (!requester) return []

    // Super admin voit tout
    if (requester.coach_level === 'super_admin') {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      return data || []
    }

    // Coach principal voit tous les athlètes + ses coaches juniors
    if (requester.coach_level === 'principal') {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`role.eq.athlete,and(role.eq.coach,coach_level.eq.junior,managed_by.eq.${requesterId})`)
        .order('created_at', { ascending: false })
      return data || []
    }

    // Coach junior voit tous les athlètes
    if (requester.coach_level === 'junior') {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'athlete')
        .order('created_at', { ascending: false })
      return data || []
    }

    // Athlète ne voit que son propre profil
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', requesterId)
      .single()
    return data ? [data] : []
  }

  // Créer ou mettre à jour un profil
  static async upsertProfile(profile: Partial<AdminUser>): Promise<AdminUser | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(profile)
      .select()
      .single()

    if (error) {
      console.error('Profile upsert error:', error)
      return null
    }

    return data
  }
}