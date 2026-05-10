import { AIAssistant } from "@/components/dashboard/ai-assistant"

export const metadata = {
  title: "AI Assistant | PrepTrack",
  description: "Get help from your AI study assistant",
}

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Study Assistant</h1>
        <p className="text-muted-foreground">
          Get instant help with concepts, doubts, and study tips
        </p>
      </div>
      <div className="max-w-3xl">
        <AIAssistant />
      </div>
    </div>
  )
}
