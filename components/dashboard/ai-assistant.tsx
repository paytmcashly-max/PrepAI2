'use client'

import { useState, useTransition } from 'react'
import { Bot, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { aiFeatureConfigs, type AIFeatureConfig } from '@/lib/config/ai-placeholders'
import { cn } from '@/lib/utils'

type PlaceholderResponse = {
  status: string
  title: string
  message: string
  safety: {
    backend_only: boolean
    provider_called: boolean
    frontend_key_exposed: boolean
  }
}

export function AIAssistant() {
  const [selectedFeature, setSelectedFeature] = useState<AIFeatureConfig>(aiFeatureConfigs[0])
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState<PlaceholderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const callPlaceholder = () => {
    setError(null)
    setResponse(null)

    startTransition(async () => {
      try {
        const apiResponse = await fetch(selectedFeature.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })

        const payload = await apiResponse.json()
        if (!apiResponse.ok) {
          throw new Error(payload.error || 'AI placeholder request failed.')
        }

        setResponse(payload)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'AI placeholder request failed.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {aiFeatureConfigs.map((feature) => {
          const Icon = feature.icon
          const isSelected = selectedFeature.id === feature.id

          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => {
                setSelectedFeature(feature)
                setResponse(null)
                setError(null)
              }}
              className={cn(
                'rounded-lg border bg-card p-4 text-left transition hover:border-primary/60 hover:bg-accent/40',
                isSelected && 'border-primary bg-primary/5'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{feature.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {selectedFeature.title}
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </CardTitle>
                <CardDescription>Backend-only placeholder route</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              No frontend provider key
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              callPlaceholder()
            }}
          >
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={selectedFeature.promptPlaceholder}
              disabled={isPending}
              className="min-h-10 flex-1"
            />
            <Button type="submit" disabled={isPending}>
              <Send className="mr-2 h-4 w-4" />
              {isPending ? 'Checking...' : 'Call Route'}
            </Button>
          </form>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {response ? (
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{response.title}</h3>
                <Badge variant="outline">{response.status.replace('_', ' ')}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{response.message}</p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                <Badge variant="secondary">Backend only: {String(response.safety.backend_only)}</Badge>
                <Badge variant="secondary">Provider called: {String(response.safety.provider_called)}</Badge>
                <Badge variant="secondary">Frontend key: {String(response.safety.frontend_key_exposed)}</Badge>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">AI routes are ready for future provider wiring</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Requests are authenticated and return structured coming-soon responses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
