'use client'

import { useState, useEffect, useRef } from 'react'
import ThoughtCanvas from './thought-canvas'

interface ConversationItem {
  type: 'user' | 'assistant'
  content: string
  clarity?: number
  depth?: number
  phase?: string
}

export default function EthraicInterface() {
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState<ConversationItem[]>([])
  const [currentTagline, setCurrentTagline] = useState(0)
  const [isThinking, setIsThinking] = useState(false)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  const taglines = [
    "THINK FASTER, SEE CLEARLY",
    "CUT THROUGH THE NOISE", 
    "FIND CLARITY FASTER",
    "SIMPLIFY COMPLEX THOUGHTS",
    "GET TO THE POINT",
    "REDUCE MENTAL FRICTION",
    "ACCELERATE UNDERSTANDING",
    "STRIP AWAY CONFUSION",
    "FOCUS YOUR THINKING",
    "SHARPEN YOUR PERSPECTIVE"
  ]

  // Rotate taglines with slow fade
  useEffect(() => {
    const interval = setInterval(() => {
      const taglineEl = document.querySelector('.tagline-text')
      if (taglineEl instanceof HTMLElement) {
        taglineEl.style.transition = 'opacity 1s ease-in-out'
        taglineEl.style.opacity = '0'
        
        setTimeout(() => {
          setCurrentTagline((prev) => (prev + 1) % taglines.length)
          setTimeout(() => {
            if (taglineEl instanceof HTMLElement) {
              taglineEl.style.opacity = '0.7'
            }
          }, 50)
        }, 1000)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [taglines.length])

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const handleThink = async () => {
    if (!input.trim() || isThinking) return

    const userMessage = input.trim()
    setInput('')
    setIsThinking(true)

    // Add user message to conversation
    const newUserMessage: ConversationItem = { type: 'user', content: userMessage }
    setConversation(prev => [...prev, newUserMessage])

    // Trigger thought animation if available
    if (typeof window !== 'undefined' && window.createThoughtCluster) {
      window.createThoughtCluster(window.innerWidth / 2, window.innerHeight / 2, 0.5)
    }

    try {
      const response = await fetch('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      if (!response.ok) {
        throw new Error('Response not ok')
      }

      const data = await response.json()

      // Add assistant response to conversation
      const newAssistantMessage: ConversationItem = {
        type: 'assistant',
        content: data.response || "I'm processing that thought...",
        clarity: data.clarity || 0,
        depth: data.depth || 0,
        phase: data.phase || 'SURFACE'
      }
      
      setConversation(prev => [...prev, newAssistantMessage])
      
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: ConversationItem = {
        type: 'assistant',
        content: "I encountered an issue processing that thought. Please try again.",
        clarity: 0,
        depth: 0,
        phase: 'ERROR'
      }
      setConversation(prev => [...prev, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  // Get latest metrics for header display
  const latestMetrics = conversation.length > 0 
    ? conversation.filter(item => item.type === 'assistant').pop()
    : null

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Animated thought patterns background */}
      <ThoughtCanvas />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-8 z-20 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-light tracking-[0.3em]">ETHRAIC</h1>
          <div className="mt-2 text-xs tracking-widest opacity-50">
            <span>CLARITY: {latestMetrics?.clarity || 0}%</span>
            <span className="mx-4">|</span>
            <span>DEPTH: {latestMetrics?.depth || 0}%</span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="pt-32 pb-32 px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Tagline */}
          <p className="tagline-text text-center text-xs tracking-[0.2em] opacity-70 mb-12">
            {taglines[currentTagline]}
          </p>

          {/* Conversation display */}
          <div className="space-y-8">
            {conversation.map((item, index) => (
              <div key={index} className="animate-fadeIn">
                {item.type === 'user' ? (
                  <div className="text-gray-400">
                    <span className="italic">You:</span> {item.content}
                  </div>
                ) : (
                  <div className="border-l border-gray-800 pl-6 space-y-2">
                    <p className="text-gray-100 leading-relaxed">{item.content}</p>
                    {item.clarity !== undefined && (
                      <div className="text-xs tracking-widest opacity-40 pt-2">
                        CLARITY: {item.clarity}% | DEPTH: {item.depth}% | PHASE: {item.phase}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>

          {/* Welcome message if no conversation */}
          {conversation.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <p className="text-sm">What are you thinking about?</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom input area */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-black bg-opacity-90 backdrop-blur-sm z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleThink()}
              placeholder="What are you thinking about?"
              className="w-full bg-transparent border-b border-gray-800 text-white placeholder-gray-600 
                       focus:outline-none focus:border-gray-600 transition-colors px-2 py-2 text-center"
              disabled={isThinking}
            />
            <button
              onClick={handleThink}
              disabled={isThinking}
              className="w-20 h-20 rounded-full border border-gray-800 hover:border-gray-600 
                       transition-all hover:scale-105 active:scale-95 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="text-xs tracking-widest">
                {isThinking ? '...' : 'THINK'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}