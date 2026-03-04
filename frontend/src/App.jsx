import { useState, useRef, useEffect } from 'react'
import './App.css'

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

function Message({ role, text }) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className="msg-enter" style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 40px' }}>
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

  return (
    <div className="msg-enter" style={{ padding: '2px 40px' }}>
      <div style={{
        fontSize: 15,
        lineHeight: 1.8,
        color: '#d4d4d4',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {text}
      </div>
    </div>
  )
}

/* Welcome screen shown before first user message */
function WelcomeScreen() {
  return (
    <div className="msg-enter" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, gap: 16, paddingBottom: 60,
    }}>
      <img
        src="/logo.png"
        alt="Agent Max"
        style={{ width: 80, height: 80, imageRendering: 'pixelated' }}
      />
      <div style={{ textAlign: 'center' }}>
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
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState(false)
  const bottomRef               = useRef(null)
  const textareaRef             = useRef(null)

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
    setMessages(p => [...p, { id: Date.now(), role: 'user', text }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    try {
      const base = import.meta.env.VITE_API_URL ?? ''
      const res = await fetch(`${base}/agent?input=${encodeURIComponent(text)}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(p => [...p, { id: Date.now() + 1, role: 'ai', text: data.response ?? '...' }])
    } catch {
      setMessages(p => [...p, { id: Date.now() + 1, role: 'ai', text: '⚠️ Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const canSend = input.trim() && !loading

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: '100vh',
      width: '100%', maxWidth: 760,
      background: '#212121',
    }}>

      {/* ── Header — only show once chatting ── */}
      {hasMessages && (
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 24px',
          borderBottom: '1px solid #2c2c2c',
          flexShrink: 0,
        }}>
          <img
            src="/logo.png"
            alt="Agent Max"
            style={{ width: 24, height: 24, imageRendering: 'pixelated' }}
          />
          <span className="shimmer-text" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Agent Max
          </span>
        </header>
      )}

      {/* ── Main area ── */}
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
        {/* Welcome state */}
        {!hasMessages && <WelcomeScreen />}

        {/* Messages */}
        {messages.map(m => (
          <Message key={m.id} role={m.role} text={m.text} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="msg-enter" style={{ padding: '2px 40px' }}>
            <TypingDots />
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* ── Input ── */}
      <div style={{ padding: '10px 20px 26px', flexShrink: 0 }}>
        <div className="input-glow">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#2c2c2c',
            borderRadius: 28,
            padding: '13px 13px 13px 20px',
            border: focused ? '1px solid transparent' : '1px solid #383838',
            transition: 'border-color 0.2s',
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
              onMouseEnter={e => { if (canSend) e.currentTarget.style.transform = 'scale(1.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
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
