import { redirect } from 'next/navigation'

export default function MockTestsRedirectPage() {
  redirect('/dashboard/mock-tests')
}
