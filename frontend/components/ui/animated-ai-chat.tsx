'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Command,
  ImageIcon,
  LoaderIcon,
  MonitorIcon,
  Paperclip,
  PenTool,
  SendIcon,
  Sparkles,
  XIcon
} from 'lucide-react'

type CommandSuggestion = {
  icon: React.ReactNode
  label: string
  prefix: string
}

const COMMANDS: CommandSuggestion[] = [
  { icon: <ImageIcon size={14} />, label: 'Clone UI', prefix: '/clone' },
  { icon: <PenTool size={14} />, label: 'Import Figma', prefix: '/figma' },
  { icon: <MonitorIcon size={14} />, label: 'Create Page', prefix: '/page' },
  { icon: <Sparkles size={14} />, label: 'Improve', prefix: '/improve' }
]

function useAutoResize(minHeight: number, maxHeight: number) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = `${minHeight}px`
    const next = Math.min(maxHeight, Math.max(minHeight, el.scrollHeight))
    el.style.height = `${next}px`
  }, [maxHeight, minHeight])

  useEffect(() => {
    resize()
  }, [resize])

  return { ref, resize }
}

export function AnimatedAIChat() {
  const [value, setValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const [showPalette, setShowPalette] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const paletteRef = useRef<HTMLDivElement | null>(null)
  const commandBtnRef = useRef<HTMLButtonElement | null>(null)
  const { ref: textareaRef, resize } = useAutoResize(64, 180)

  const filtered = useMemo(() => {
    if (!value.startsWith('/')) return COMMANDS
    const head = value.trim().toLowerCase()
    return COMMANDS.filter(cmd => cmd.prefix.startsWith(head))
  }, [value])

  useEffect(() => {
    const onlyCommandToken = value.startsWith('/') && !value.includes(' ')
    setShowPalette(onlyCommandToken)
    setActiveIndex(0)
  }, [value])

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        paletteRef.current?.contains(target) ||
        commandBtnRef.current?.contains(target)
      ) {
        return
      }
      setShowPalette(false)
    }

    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pickCommand = (index: number) => {
    const cmd = filtered[index]
    if (!cmd) return
    setValue(`${cmd.prefix} `)
    setShowPalette(false)
  }

  const send = () => {
    if (!value.trim() || isTyping) return
    setIsTyping(true)
    window.setTimeout(() => {
      setIsTyping(false)
      setValue('')
      setAttachments([])
      const el = textareaRef.current
      if (el) el.style.height = '64px'
    }, 1200)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPalette && filtered.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex(prev => (prev + 1) % filtered.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        pickCommand(activeIndex)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setShowPalette(false)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="ff-ai-chat lab-bg">
      <div className="ff-ai-chat-head">
        <h3>How can I help today?</h3>
        <p>Type a command or ask a question</p>
      </div>

      {showPalette && filtered.length > 0 && (
        <div ref={paletteRef} className="ff-ai-chat-palette" role="listbox" aria-label="Commands">
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.prefix}
              type="button"
              className={`ff-ai-chat-command${idx === activeIndex ? ' active' : ''}`}
              onClick={() => pickCommand(idx)}
            >
              <span className="ff-ai-chat-command-icon">{cmd.icon}</span>
              <span className="ff-ai-chat-command-label">{cmd.label}</span>
              <span className="ff-ai-chat-command-prefix">{cmd.prefix}</span>
            </button>
          ))}
        </div>
      )}

      <div className="ff-ai-chat-input-wrap">
        <textarea
          ref={textareaRef}
          className="ff-ai-chat-input"
          placeholder="Ask Falcon a question..."
          value={value}
          onChange={e => {
            setValue(e.target.value)
            resize()
          }}
          onKeyDown={onKeyDown}
          rows={2}
        />
      </div>

      {attachments.length > 0 && (
        <div className="ff-ai-chat-attachments">
          {attachments.map((file, index) => (
            <span key={`${file}-${index}`} className="ff-ai-chat-attachment">
              {file}
              <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}>
                <XIcon size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="ff-ai-chat-actions">
        <div className="ff-ai-chat-left-actions">
          <button
            type="button"
            className="ff-ai-chat-icon-btn"
            onClick={() => setAttachments(prev => [...prev, `file-${Math.floor(Math.random() * 1000)}.pdf`])}
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <button
            ref={commandBtnRef}
            type="button"
            className={`ff-ai-chat-icon-btn${showPalette ? ' active' : ''}`}
            onClick={() => setShowPalette(prev => !prev)}
            aria-label="Toggle command menu"
          >
            <Command size={16} />
          </button>
        </div>

        <button
          type="button"
          className="ff-ai-chat-send-btn"
          onClick={send}
          disabled={!value.trim() || isTyping}
        >
          {isTyping ? <LoaderIcon size={14} className="ff-spin" /> : <SendIcon size={14} />}
          <span>{isTyping ? 'Thinking' : 'Send'}</span>
        </button>
      </div>
    </div>
  )
}
