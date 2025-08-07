'use client'

import { useState, useEffect, useRef } from 'react'
import ThoughtCanvas from './thought-canvas'

interface ConversationItem {
  type: 'user' | 'assistant'
  content: string
  clarity?: number
  depth?: number
  phase?: string
  condensed?: string
  essence?: string[]
  isTyping?: boolean
  displayedContent?: string
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
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Typewriter effect for the latest assistant message
  useEffect(() => {
    const lastMessage = conversation[conversation.length - 1]
    if (!lastMessage || lastMessage.type !== 'assistant' || !lastMessage.isTyping) return

    const fullText = lastMessage.content
    let currentIndex = 0
    const typingSpeed = 15 // milliseconds per character (smooth, not too fast)

    const typeInterval = setInterval(() => {
      currentIndex++
      
      setConversation(prev => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        if (lastMsg && lastMsg.type === 'assistant') {
          lastMsg.displayedContent = fullText.slice(0, currentIndex)
          
          // When typing is complete
          if (currentIndex >= fullText.length) {
            lastMsg.isTyping = false
            clearInterval(typeInterval)
          }
        }
        return updated
      })
    }, typingSpeed)

    return () => clearInterval(typeInterval)
  }, [conversation.length]) // Only run when a new message is added

  // Extract essence from text (key phrases)
  const extractEssence = (text: string): string[] => {
    // Simple extraction - in production, use NLP
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const keywords: string[] = []
    
    // Extract important phrases
    sentences.forEach(sentence => {
      // Look for key patterns
      if (sentence.includes('is') || sentence.includes('are')) {
        const parts = sentence.split(/\bis\b|\bare\b/i)
        if (parts.length > 1) {
          const essence = parts[1].trim().split(' ').slice(0, 5).join(' ')
          if (essence.length > 10) keywords.push(essence)
        }
      }
    })
    
    // If no patterns found, take first few words
    if (keywords.length === 0 && sentences.length > 0) {
      keywords.push(sentences[0].trim().split(' ').slice(0, 7).join(' '))
    }
    
    return keywords.slice(0, 3) // Max 3 essence fragments
  }

  // Create condensed version
  const condenseText = (text: string): string => {
    const words = text.split(' ')
    if (words.length <= 20) return text
    return words.slice(0, 20).join(' ') + '...'
  }

  const handleSubmit = async () => {
    if (!input.trim() || isThinking) return

    const userMessage = input.trim()
    setInput('')
    setIsThinking(true)

    // Add user message to conversation immediately (no animation)
    const userItem: ConversationItem = {
      type: 'user',
      content: userMessage,
      condensed: condenseText(userMessage),
      essence: extractEssence(userMessage)
    }
    
    setConversation(prev => [...prev, userItem])

    try {
      // Trigger thought animation
      if (typeof window !== 'undefined' && window.createThoughtCluster) {
        window.createThoughtCluster(
          window.innerWidth / 2,
          window.innerHeight / 2,
          0.8
        )
      }

      // Call the API
      const response = await fetch('/api/think', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          context: conversation.slice(-5).map(c => ({
            role: c.type === 'user' ? 'user' : 'assistant',
            content: c.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Add assistant response with typing animation
      const assistantItem: ConversationItem = {
        type: 'assistant',
        content: data.response || "I'm processing your thought...",
        clarity: data.clarity || 50,
        depth: data.depth || 50,
        phase: data.phase || 'SHALLOW',
        condensed: condenseText(data.response || ""),
        essence: extractEssence(data.response || ""),
        isTyping: true,
        displayedContent: ''
      }

      // Small delay to enhance the visual flow
      setTimeout(() => {
        setConversation(prev => [...prev, assistantItem])
      }, 100)

      // Trigger enhanced animation
      if (typeof window !== 'undefined' && window.createThoughtCluster) {
        const intensity = (data.depth || 50) / 100
        window.createThoughtCluster(
          window.innerWidth / 2,
          window.innerHeight / 2,
          intensity
        )
      }

    } catch (error) {
      console.error('Error:', error)
      
      const errorItem: ConversationItem = {
        type: 'assistant',
        content: "I encountered an issue processing your thought. Please try again.",
        clarity: 0,
        depth: 0,
        phase: 'SURFACE',
        isTyping: false,  // No typing effect for errors
        displayedContent: "I encountered an issue processing your thought. Please try again."
      }
      
      setConversation(prev => [...prev, errorItem])
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Get display state for each message based on position
  const getDisplayState = (index: number, total: number) => {
    const fromEnd = total - index - 1
    if (fromEnd === 0) return 'full' // Most recent
    if (fromEnd === 1) return 'condensing' // Second most recent
    if (fromEnd <= 3) return 'condensed' // Recent history
    return 'essence' // Older messages
  }

  const latestMetrics = conversation.length > 0 
    ? conversation[conversation.length - 1]
    : null

  const currentClarity = latestMetrics?.clarity || 50
  const currentDepth = latestMetrics?.depth || 50

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Thought Canvas Background */}
      <ThoughtCanvas />
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-8">
          <h1 className="text-2xl tracking-[0.3em] font-light">ETHRAIC</h1>
          <div className="mt-2 text-xs tracking-wider opacity-60">
            CLARITY: {currentClarity}% | DEPTH: {currentDepth}%
          </div>
        </header>

        {/* Tagline - Smaller */}
        <div className="px-8 mb-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="relative h-6">
              {taglines.map((tagline, index) => (
                <p
                  key={index}
                  className={`absolute inset-0 text-xs tracking-[0.2em] font-light transition-opacity duration-1000 ${
                    index === currentTagline ? 'opacity-40' : 'opacity-0'
                  }`}
                >
                  {tagline}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation Display with Condensation Effect */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-5xl mx-auto px-8 h-full flex flex-col justify-end pb-4">
            <div className="space-y-2 overflow-y-auto max-h-[60vh]">
              {conversation.map((item, index) => {
                const displayState = getDisplayState(index, conversation.length)
                const isLatest = index === conversation.length - 1
                
                return (
                  <div
                    key={index}
                    className={`transform transition-all ease-out ${
                      // Only animate assistant responses
                      isLatest && item.type === 'assistant' ? 'animate-fadeIn duration-1500' : 
                      item.type === 'assistant' ? 'duration-1000' : 'duration-300'
                    }`}
                    style={{
                      opacity: displayState === 'essence' ? 0.3 : 
                               displayState === 'condensed' ? 0.5 : 
                               displayState === 'condensing' ? 0.7 : 1,
                      transform: displayState === 'essence' ? 'scale(0.85)' : 
                                displayState === 'condensed' ? 'scale(0.9)' : 
                                displayState === 'condensing' ? 'scale(0.95)' : 'scale(1)',
                    }}
                  >
                    {/* Essence View - Oldest Messages */}
                    {displayState === 'essence' && item.essence && (
                      <div className="flex flex-wrap gap-2 py-1">
                        {item.essence.map((fragment, i) => (
                          <span 
                            key={i}
                            className="text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10 tracking-wide"
                          >
                            {fragment}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Condensed View */}
                    {displayState === 'condensed' && (
                      <div className={`p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-white/5`}>
                        <span className="text-xs opacity-40 tracking-wider">
                          {item.type === 'user' ? '→' : '←'}
                        </span>
                        <span className="ml-2 text-sm opacity-60">
                          {item.condensed || item.content}
                        </span>
                      </div>
                    )}
                    
                    {/* Condensing View */}
                    {displayState === 'condensing' && (
                      <div className={`p-4 rounded-lg transition-all duration-500 ${
                        item.type === 'user' 
                          ? 'bg-black/40 backdrop-blur-sm border border-white/10' 
                          : 'bg-black/50 backdrop-blur-sm border border-white/15'
                      }`}>
                        <div className="text-xs opacity-50 mb-2 tracking-wider">
                          {item.type === 'user' ? 'YOU' : 'ETHRAIC'}
                        </div>
                        <div className="text-sm opacity-80 leading-relaxed">
                          {item.isTyping ? item.displayedContent : item.content}
                        </div>
                      </div>
                    )}
                    
                    {/* Full View - Latest Message */}
                    {displayState === 'full' && (
                      <div className={`p-6 rounded-lg ${
                        item.type === 'user' 
                          ? 'bg-black/30 backdrop-blur-sm border border-white/10' 
                          : 'bg-black/60 backdrop-blur-md border border-white/25 shadow-2xl'
                      }`}>
                        <div className="text-xs opacity-60 mb-3 tracking-wider">
                          {item.type === 'user' ? 'YOU' : 'ETHRAIC'}
                        </div>
                        <div className={`whitespace-pre-wrap leading-relaxed ${
                          item.type === 'assistant' 
                            ? 'tracking-wide font-light text-white/95' 
                            : 'text-white/70'
                        }`}>
                          {item.type === 'assistant' && item.isTyping 
                            ? (
                              <>
                                {item.displayedContent}
                                <span className="inline-block w-0.5 h-4 ml-0.5 bg-white/70 animate-pulse" />
                              </>
                            )
                            : item.content}
                        </div>
                        {item.type === 'assistant' && item.phase && !item.isTyping && (
                          <div className="mt-4 text-xs opacity-40 tracking-wider animate-fadeIn">
                            CLARITY: {item.clarity}% | DEPTH: {item.depth}% | PHASE: {item.phase}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={conversationEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What are you thinking about?"
              disabled={isThinking}
              className="w-full bg-transparent border-b border-white/20 pb-2 text-lg font-light tracking-wide focus:outline-none focus:border-white/40 transition-all duration-300 placeholder:text-white/30 disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={isThinking || !input.trim()}
              className="mt-8 mx-auto block px-8 py-3 border border-white/20 rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-300 tracking-wider font-light disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/20"
            >
              {isThinking ? 'PROCESSING...' : 'THINK'}
            </button>
            {/* TODO: Add SPEAK button for voice input
            <button className="...">SPEAK</button>
            */}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.98);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  )
}