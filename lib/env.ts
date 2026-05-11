import 'server-only'

function requireServerEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getSupabaseServerEnv() {
  return {
    supabaseUrl: requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireServerEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}

export function getSupabaseAdminEnv() {
  return {
    supabaseUrl: requireServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey: requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
  }
}

export function getRuntimeHealthEnv() {
  return {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || '0.1.0',
    latestCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
  }
}
