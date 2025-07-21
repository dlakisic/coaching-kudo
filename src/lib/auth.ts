import { createServerComponentClient } from './supabase-server'
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
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
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