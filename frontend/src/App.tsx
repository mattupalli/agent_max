import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlurFade } from './components/ui/blur-fade'
import { BorderBeam } from './components/ui/border-beam'
import { Particles } from './components/ui/particles'
import './App.css'

interface Message {
  id: number
  role: 'user' | 'ai'
  text: string
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '6px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  )
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="msg-pad" style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '72%',
        background: '#303030',
        borderRadius: 20,
        padding: '11px 17px',
        fontSize: 15,
        lineHeight: 1.65,
        color: '#ececec',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        border: '1px solid #3a3a3a',
      }}>
        {text}
      </div>
    </div>
  )
}

function AiMessage({ text }: { text: string }) {
  return (
    <div className="msg-pad">
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  )
}

function Message({ role, text }: Message) {
  return (
    <BlurFade direction="up" duration={0.25} delay={0}>
      {role === 'user' ? <UserMessage text={text} /> : <AiMessage text={text} />}
    </BlurFade>
  )
}

function WelcomeScreen() {
  return (
    <div style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, gap: 16, paddingBottom: 60,
      overflow: 'hidden',
    }}>
      <Particles
        className="absolute inset-0"
        quantity={50}
        color="#fbbf24"
        size={0.5}
        staticity={60}
      />
      <img
        src="/logo.png"
        alt="Agent Max"
        style={{ width: 80, height: 80, imageRendering: 'pixelated', position: 'relative' }}
      />
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <h2 className="shimmer-text" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Agent Max
        </h2>
        <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
          Ask me anything. I'm here to help.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasMessages = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const grow = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsgId = Date.now()
    const aiId = userMsgId + 1
    setMessages(p => [...p,
      { id: userMsgId, role: 'user', text },
      { id: aiId, role: 'ai', text: '' },
    ])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    try {
      const base = import.meta.env.VITE_API_URL ?? ''
      const res = await fetch(`${base}/agent?input=${encodeURIComponent(text)}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setLoading(false)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          const chunk = JSON.parse(data) as string
          setMessages(p => p.map(m => m.id === aiId ? { ...m, text: m.text + chunk } : m))
        }
      }
    } catch {
      setMessages(p => p.map(m =>
        m.id === aiId ? { ...m, text: '⚠️ Something went wrong. Please try again.' } : m
      ))
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const canSend = Boolean(input.trim()) && !loading

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', minHeight: '100dvh',
      width: '100%', maxWidth: 760,
      background: '#212121',
    }}>

      {/* Header */}
      {hasMessages && (
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 24px',
          borderBottom: '1px solid #2c2c2c',
          flexShrink: 0,
        }}>
          <img src="/logo.png" alt="Agent Max" style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
          <span className="shimmer-text" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Agent Max
          </span>
        </header>
      )}

      {/* Messages */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        paddingTop: hasMessages ? 28 : 0,
        paddingBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        scrollbarWidth: 'thin',
        scrollbarColor: '#333 transparent',
      }}>
        {!hasMessages && <WelcomeScreen />}

        {messages.map(m => (
          <Message key={m.id} id={m.id} role={m.role} text={m.text} />
        ))}

        {loading && (
          <BlurFade direction="up" duration={0.2}>
            <div className="msg-pad"><TypingDots /></div>
          </BlurFade>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <div className="input-area" style={{ flexShrink: 0 }}>
        <div style={{ position: 'relative', borderRadius: 28, isolation: 'isolate' }}>
          {/* BorderBeam — always visible, faster when focused */}
          <BorderBeam
            size={80}
            duration={focused ? 2.5 : 5}
            colorFrom="#fbbf24"
            colorTo="#d97706"
            borderWidth={1}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#2c2c2c',
            borderRadius: 28,
            padding: '13px 13px 13px 20px',
            border: '1px solid #383838',
            position: 'relative',
            zIndex: 1,
          }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={loading}
              placeholder="Message Agent Max"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={e => { setInput(e.target.value); grow() }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#e8e8e8', fontSize: 15, fontFamily: 'inherit',
                lineHeight: 1.55, resize: 'none', minHeight: 24, maxHeight: 180, padding: 0,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!canSend}
              className={canSend ? 'send-active' : ''}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none',
                background: canSend ? 'linear-gradient(135deg, #fbbf24, #d97706)' : '#383838',
                color: canSend ? '#fff' : '#666',
                cursor: canSend ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => { if (canSend) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#3d3d3d', marginTop: 9 }}>
          Agent Max can make mistakes. Check important info.
        </p>
      </div>

    </div>
  )
}
