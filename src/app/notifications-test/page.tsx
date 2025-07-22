import { requireAuth, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import NotificationsTestClient from './NotificationsTestClient'

export default async function NotificationsTestPage() {
  const user = await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/setup-profile')
  }

  return (
    <>
      <Navigation userRole={profile.role} userName={profile.name} />
      <NotificationsTestClient userRole={profile.role} />
    </>
  )
}