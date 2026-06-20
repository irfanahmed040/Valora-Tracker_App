import { redirect } from 'next/navigation'

export default function MonthPage() {
  redirect('/calendar?view=month')
}
