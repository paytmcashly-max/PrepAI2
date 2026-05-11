import type React from 'react'

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-muted px-1 py-0.5 text-sm">{part.slice(1, -1)}</code>
    }
    return <span key={index}>{part}</span>
  })
}

export function MarkdownLite({ content }: { content: string }) {
  const lines = content.split(/\r?\n/)
  const blocks: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length === 0) return
    blocks.push(
      <ul key={`list-${blocks.length}`} className="ml-5 list-disc space-y-1">
        {listItems.map((item, index) => (
          <li key={`${index}-${item}`} className="break-words leading-relaxed">{renderInline(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }
    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
      return
    }
    flushList()
    if (trimmed.startsWith('# ')) {
      blocks.push(<h1 key={index} className="break-words text-3xl font-bold tracking-tight">{trimmed.slice(2)}</h1>)
    } else if (trimmed.startsWith('## ')) {
      blocks.push(<h2 key={index} className="break-words text-2xl font-semibold">{trimmed.slice(3)}</h2>)
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push(<p key={index} className="break-words leading-relaxed">{renderInline(trimmed)}</p>)
    } else {
      blocks.push(<p key={index} className="break-words leading-relaxed">{renderInline(trimmed)}</p>)
    }
  })
  flushList()

  return <div className="space-y-4">{blocks}</div>
}
