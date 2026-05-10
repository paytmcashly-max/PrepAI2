import { NextRequest } from 'next/server'
import { handleAIPlaceholder } from '@/lib/ai/placeholder-route'

export async function POST(request: NextRequest) {
  return handleAIPlaceholder(request, 'weakness-detector')
}
