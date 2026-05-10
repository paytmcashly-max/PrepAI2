"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, Sparkles, BookOpen, Brain, Calculator, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  { icon: Calculator, text: "Explain percentage shortcuts" },
  { icon: Brain, text: "Tips for solving syllogism" },
  { icon: BookOpen, text: "How to improve reading speed?" },
  { icon: Globe, text: "Important current affairs topics" },
]

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI study assistant. I can help you with concepts, solve doubts, explain topics, and provide study tips for your SSC CGL preparation. What would you like to learn today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response (placeholder for actual AI integration)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getPlaceholderResponse(input),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              PrepTrack AI
              <Sparkles className="w-4 h-4 text-amber-500" />
            </CardTitle>
            <CardDescription>Your personal study assistant</CardDescription>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestedQuestions.map((q, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-xs h-auto py-2 px-3"
                onClick={() => handleSuggestedQuestion(q.text)}
              >
                <q.icon className="w-3 h-3 mr-2 flex-shrink-0" />
                <span className="truncate">{q.text}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <CardContent className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask me anything about your preparation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Placeholder responses - will be replaced with actual AI integration
function getPlaceholderResponse(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes("percentage") || lowerQuestion.includes("shortcut")) {
    return `Great question! Here are some percentage shortcuts for SSC CGL:

1. **Fraction to Percentage**: Memorize common fractions
   - 1/4 = 25%, 1/5 = 20%, 1/8 = 12.5%
   - 1/6 = 16.67%, 1/3 = 33.33%

2. **Quick Calculations**:
   - To find 15% of any number: Find 10% + half of 10%
   - For 25%: Divide by 4
   - For 75%: Find 50% + 25%

3. **Successive Percentage**: 
   If a value increases by a% then decreases by a%, net change = -a²/100

Practice these daily and you'll solve percentage questions in seconds!`
  }

  if (lowerQuestion.includes("syllogism")) {
    return `Here are key tips for solving syllogism questions:

1. **Venn Diagram Method** (Most Reliable):
   - Draw circles for each term
   - Mark the relationship based on statements
   - Check if conclusions follow

2. **Standard Rules**:
   - All + All = All (Middle term distributed)
   - Some + All = Some
   - No + All = No
   - Some + Some = No conclusion

3. **Watch for**:
   - "Some" is reversible (Some A are B = Some B are A)
   - "All" is not reversible
   - "Only" means "All" in reverse

Practice 10 syllogism questions daily for 2 weeks and you'll master it!`
  }

  if (lowerQuestion.includes("reading") || lowerQuestion.includes("speed")) {
    return `To improve reading speed for SSC CGL English section:

1. **Daily Practice**: Read for at least 30 minutes daily
   - The Hindu Editorial
   - Short stories or articles

2. **Chunking**: Read groups of words, not individual words

3. **Avoid Sub-vocalization**: Don't read aloud in your mind

4. **Skim First**: Get the main idea before detailed reading

5. **Build Vocabulary**: Learn 10 new words daily

6. **Time Yourself**: Practice RCs with timer (8-10 min per passage)

Consistent practice will improve both speed and comprehension!`
  }

  if (lowerQuestion.includes("current affairs") || lowerQuestion.includes("ga")) {
    return `Important Current Affairs topics for SSC CGL:

1. **Government Schemes**: PM-KISAN, Ayushman Bharat, Digital India

2. **Awards & Honors**: Padma Awards, Bharat Ratna, Sports Awards

3. **International Events**: G20/G7 summits, UN events

4. **Economy**: Budget highlights, RBI policies, New tax rules

5. **Sports**: Major tournaments, Indian achievements

6. **Science & Tech**: ISRO missions, Defense developments

**Study Tips**:
- Read monthly CA magazines (Pratiyogita Darpan, etc.)
- Make short notes weekly
- Focus on last 6 months before exam

I can help you with specific topics if needed!`
  }

  return `That's a great question! While I'm currently in demo mode, here's some general guidance:

1. **Break down the topic** into smaller, manageable concepts
2. **Practice regularly** with previous year questions
3. **Make short notes** for quick revision
4. **Time yourself** while practicing

For specific doubts on Quant, Reasoning, English, or GK topics, feel free to ask! I'm here to help you succeed in your SSC CGL preparation.

*Note: Full AI capabilities with detailed explanations, personalized study plans, and doubt solving will be available soon!*`
}
