import { redirect } from 'next/navigation'

export default function Home() {
  // Cette page sera gérée par le middleware
  redirect('/login')
}