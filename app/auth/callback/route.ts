import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') || 'localhost'
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const protocol = isLocalEnv ? 'http' : 'https'
      return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`)
    }
  }

  return NextResponse.redirect(`${new URL(request.url).origin}/auth/error`)
}
