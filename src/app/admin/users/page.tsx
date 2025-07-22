import { requireAuth } from '@/lib/auth'
import { AdminService } from '@/lib/supabase-admin'
import Navigation from '@/components/Navigation'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  const user = await requireAuth()
  
  // Récupérer tous les profils visibles par l'utilisateur connecté
  const profiles = await AdminService.getVisibleProfiles(user.id)

  return (
    <>
      <Navigation userRole="coach" userName={user.email || 'Admin'} />
      <AdminUsersClient profiles={profiles} />
    </>
  )
}