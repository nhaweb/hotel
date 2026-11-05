import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import { getAdminFaqs } from '@/lib/actions/admin-faqs'
import { FaqsManager } from '@/components/admin/faqs-manager'

export default async function AdminFaqsPage() {
  const auth = await getCurrentAdmin()
  if (!auth.ok) {
    redirect('/admin/login')
  }

  // Housekeeping staff is restricted from FAQs
  if (!auth.user.permissions.canAccessFaqs) {
    redirect('/admin/rooms')
  }

  const result = await getAdminFaqs()

  return (
    <FaqsManager
      initialFaqs={result.ok ? result.faqs : []}
      initialError={result.ok ? undefined : result.error}
    />
  )
}
