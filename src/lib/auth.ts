import { createServerComponentClient } from './supabase-server'
import { AdminService } from './supabase-admin'
import { redirect } from 'next/navigation'
import { Profile } from '@/types'

export async function getUser() {
  const supabase = await createServerComponentClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createServerComponentClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Utiliser le service admin pour récupérer le profil (bypass RLS)
  const profile = await AdminService.getProfile(user.id, user.id)
  
  return profile as Profile | null
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function requireRole(role: 'coach' | 'athlete') {
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect('/login')
  }
  
  if (profile.role !== role) {
    redirect('/unauthorized')
  }
  
  return profile
}