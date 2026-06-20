import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default function TargetsPage() {
  redirect(`/day/${formatDate(new Date())}`)
}
