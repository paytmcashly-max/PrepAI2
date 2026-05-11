import 'server-only'

export type GroqCoachResult =
  | { available: true; text: string }
  | { available: false; fallbackReason: string }

type GroqMessage = {
  role: 'system' | 'user'
  content: string
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'

export async function callGroqCoach(prompt: string, context: unknown, timeoutMs = 12000): Promise<GroqCoachResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { available: false, fallbackReason: 'AI coach unavailable: missing GROQ_API_KEY.' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const messages: GroqMessage[] = [
    {
      role: 'system',
      content: [
        'You are PrepAI Groq Coach v1, a safe competitive-exam study explainer.',
        'Use only the provided context. Do not invent PYQs, sources, scores, or facts.',
        'Never claim a question is official unless the context explicitly says officialVerified is true.',
        'Do not ask for or reveal private data. Do not suggest database changes.',
        'Keep answers concise, practical, and student-friendly.',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({ prompt, context }),
    },
  ]

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 600,
      }),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      return { available: false, fallbackReason: `AI coach unavailable: Groq returned ${response.status}.` }
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) {
      return { available: false, fallbackReason: 'AI coach unavailable: empty Groq response.' }
    }

    return { available: true, text: text.trim() }
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError'
      ? 'AI coach unavailable: request timed out.'
      : 'AI coach unavailable: request failed.'
    return { available: false, fallbackReason: reason }
  } finally {
    clearTimeout(timeout)
  }
}
