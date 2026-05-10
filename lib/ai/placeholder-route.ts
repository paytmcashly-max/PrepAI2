import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIFeatureId } from '@/lib/config/ai-placeholders'

const featureLabels: Record<AIFeatureId, string> = {
  'study-planner': 'AI Study Planner',
  'pyq-generator': 'AI PYQ Generator',
  'weakness-detector': 'AI Weakness Detector',
  'revision-assistant': 'AI Revision Assistant',
}

export async function handleAIPlaceholder(request: NextRequest, feature: AIFeatureId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = request.method === 'POST' ? await safeJson(request) : {}
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 500) : ''

  return NextResponse.json({
    status: 'coming_soon',
    feature,
    title: featureLabels[feature],
    prompt,
    message: `${featureLabels[feature]} is prepared as a backend-only placeholder. Provider calls will be added later through this server route.`,
    safety: {
      backend_only: true,
      provider_called: false,
      frontend_key_exposed: false,
    },
  })
}

async function safeJson(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}
