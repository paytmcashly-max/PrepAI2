import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser()
      let redirectPath = next
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('exam_target')
          .eq('id', user.id)
          .single()
        
        // Redirect to onboarding if no exam target is set
        if (!profile?.exam_target) {
          redirectPath = '/onboarding'
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') || 'localhost'
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const protocol = isLocalEnv ? 'http' : 'https'
      return NextResponse.redirect(`${protocol}://${forwardedHost}${redirectPath}`)
    }
  }

  return NextResponse.redirect(`${new URL(request.url).origin}/auth/error`)
}
