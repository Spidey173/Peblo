import React from 'react'

/**
 * Lightweight, zero-dependency Markdown renderer tailored for Peblo's Obsidian Forge theme.
 * Handles headings, bold/italic, code blocks, checklists, lists, blockquotes, and tables.
 */
export default function MarkdownView({ content, onToggleTask, editable = false }) {
  if (!content) {
    return <p className="text-ash-500 italic font-mono text-sm">Empty note...</p>
  }

  const lines = content.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockLines = []
  let currentList = []
  let listType = null // 'ul' | 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 my-2 space-y-1 font-sans text-ash-200">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{renderInline(item)}</li>
            ))}
          </ol>
        )
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-6 my-2 space-y-1 font-sans text-ash-200">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{renderInline(item)}</li>
            ))}
          </ul>
        )
      }
      currentList = []
      listType = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-md bg-obsidian-950 border border-obsidian-750 p-3 font-mono text-xs overflow-x-auto text-amber-200">
            {codeBlockLang && (
              <div className="text-[10px] uppercase tracking-wider text-ash-600 mb-1 border-b border-obsidian-800 pb-1">
                {codeBlockLang}
              </div>
            )}
            <pre><code>{codeBlockLines.join('\n')}</code></pre>
          </div>
        )
        inCodeBlock = false
        codeBlockLines = []
        codeBlockLang = ''
      } else {
        flushList()
        inCodeBlock = true
        codeBlockLang = line.trim().slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      flushList()
      elements.push(
        <hr key={`hr-${i}`} className="my-5 border-t border-obsidian-750 [html:not(.dark)_&]:border-[#D8CECA]" />
      )
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl sm:text-3xl font-display font-bold text-ash-100 mt-5 mb-2 leading-tight">
          {renderInline(line.slice(2))}
        </h1>
      )
      continue
    }
    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl sm:text-2xl font-display font-semibold text-ash-100 mt-4 mb-2 leading-snug">
          {renderInline(line.slice(3))}
        </h2>
      )
      continue
    }
    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${i}`} className="text-base sm:text-lg font-display font-semibold text-ember-spark mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      )
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-2 border-magma pl-4 py-1 my-2 italic text-ash-300 font-sans bg-magma/5 rounded-r">
          {renderInline(line.slice(2))}
        </blockquote>
      )
      continue
    }

    // Task Checklist items: - [ ] or - [x]
    const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (taskMatch) {
      flushList()
      const isChecked = taskMatch[1].toLowerCase() === 'x'
      const taskText = taskMatch[2]
      elements.push(
        <div key={`task-${i}`} className="flex items-start gap-2.5 my-1.5 font-sans text-sm">
          <input
            type="checkbox"
            checked={isChecked}
            disabled={!editable}
            onChange={() => editable && onToggleTask?.(i, !isChecked)}
            className="mt-1 rounded border-obsidian-600 text-magma focus:ring-magma bg-obsidian-900 cursor-pointer"
          />
          <span className={isChecked ? 'line-through text-ash-600' : 'text-ash-200'}>
            {renderInline(taskText)}
          </span>
        </div>
      )
      continue
    }

    // Bullet lists: - item or * item
    if (/^[-*]\s+/.test(line)) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      currentList.push(line.replace(/^[-*]\s+/, ''))
      continue
    }

    // Numbered lists: 1. item
    if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      currentList.push(line.replace(/^\d+\.\s+/, ''))
      continue
    }

    // Blank line
    if (!line.trim()) {
      flushList()
      continue
    }

    // Regular paragraph
    flushList()
    elements.push(
      <p key={`p-${i}`} className="my-2 text-sm sm:text-base leading-relaxed text-ash-200 font-sans">
        {renderInline(line)}
      </p>
    )
  }

  flushList()

  return <div className="markdown-forge space-y-1">{elements}</div>
}

/**
 * Parses inline markdown: **bold**, *italic*, `code`, ~~strike~~
 */
function renderInline(text) {
  if (typeof text !== 'string') return text

  // Tokenize inline markdown
  const parts = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-obsidian-850 border border-obsidian-750 text-ember-spark font-mono text-xs">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-bold text-ash-100">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/)
    if (italicMatch) {
      parts.push(<em key={key++} className="italic text-ash-200">{italicMatch[2]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/)
    if (strikeMatch) {
      parts.push(<span key={key++} className="line-through text-ash-500">{strikeMatch[1]}</span>)
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // Regular text up to the next special character
    const nextSpecial = remaining.search(/[`*_~]/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    } else if (nextSpecial === 0) {
      // Just a single character like * without match
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return parts
}

