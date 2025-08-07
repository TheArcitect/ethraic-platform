'use client'

import { useState, useRef, useEffect } from 'react'

interface ConversationItem {
  id: string
  question: string
  response: string
  clarity: number
  depth: number
  phase: string
  timestamp: Date
}

export default function EthraicInterface() {
  const [input, setInput] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [clarity, setClarity] = useState(0)
  const [depth, setDepth] = useState(0)
  const [taglineIndex, setTaglineIndex] = useState(0)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Rotating taglines
  const taglines = [
    "THINK FASTER, SEE CLEARLY",
    "CUT THROUGH THE NOISE",
    "FIND CLARITY FASTER",
    "SHARPEN YOUR THINKING",
    "ACCELERATE COGNITIVE SYNTHESIS",
    "NAVIGATE PARADIGM SPACE",
    "COLLAPSE DECISION SPACE",
    "CRYSTALLIZE THOUGHT PATTERNS",
    "AMPLIFY DECISION VELOCITY",
    "CLEAR YOUR THOUGHTS"
  ]

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  // Rotate taglines every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async () => {
    if (!input.trim()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      })
      
      const data = await response.json()
      
      const newEntry: ConversationItem = {
        id: Date.now().toString(),
        question: input,
        response: data.response || 'I need to think about that...',
        clarity: data.clarity || 0,
        depth: data.depth || 0,
        phase: data.phase || 'SURFACE',
        timestamp: new Date()
      }
      
      setConversationHistory(prev => [...prev, newEntry])
      setClarity(data.clarity || 0)
      setDepth(data.depth || 0)
      setInput('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start p-8">
        <div>
          <h1 className="text-xl font-light tracking-[0.3em] mb-4">ETHRAIC</h1>
          <div className="flex gap-8 text-xs opacity-40">
            <div>
              <span className="opacity-60">CLARITY: </span>
              <span>{clarity}%</span>
            </div>
            <div>
              <span className="opacity-60">DEPTH: </span>
              <span>{depth}%</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-6 text-xs tracking-wider opacity-60">
            <span className="hover:opacity-100 cursor-pointer transition-opacity">PERSONAL</span>
            <span className="hover:opacity-100 cursor-pointer transition-opacity">TEAM</span>
            <span className="hover:opacity-100 cursor-pointer transition-opacity">ENTERPRISE</span>
          </div>
          <div className="text-xs tracking-wider opacity-40 mt-2">
            <span>VOICE OFF</span>
          </div>
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto px-8 max-w-4xl mx-auto w-full">
        {conversationHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center opacity-50 tracking-widest text-xs">
              <div 
                key={taglineIndex}
                style={{ 
                  animation: 'fadeInOut 3s ease-in-out',
                }}
              >
                {taglines[taglineIndex]}...
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-8">
            {conversationHistory.map((item) => (
              <div 
                key={item.id}
                className="space-y-4"
                style={{ animation: 'fadeIn 0.5s ease-in' }}
              >
                <div className="opacity-60 text-sm italic">
                  You: {item.question}
                </div>
                <div className="text-base leading-relaxed pl-4 border-l border-gray-800">
                  {item.response}
                </div>
                <div className="flex gap-6 text-xs opacity-30 uppercase tracking-wider pl-4">
                  <span>CLARITY: {item.clarity}%</span>
                  <span>DEPTH: {item.depth}%</span>
                  <span>PHASE: {item.phase}</span>
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        )}
      </div>

      {/* Input Section - ETHRAIC Style */}
      <div className="p-8 flex flex-col items-center gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="What are you thinking about?"
          className="w-full max-w-2xl bg-transparent border-b border-gray-800 pb-2 text-center focus:outline-none focus:border-gray-600 transition-colors text-sm opacity-60 focus:opacity-100 placeholder-gray-600"
          disabled={isLoading}
        />
        
        {/* THINK Button - Original ETHRAIC Style */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="mt-4 w-28 h-28 rounded-full border border-gray-700 hover:border-gray-500 transition-all duration-500 flex items-center justify-center group relative"
        >
          <div className="absolute inset-0 rounded-full border border-gray-800 scale-110 opacity-0 group-hover:opacity-30 group-hover:scale-100 transition-all duration-500" />
          <div className="absolute inset-0 rounded-full border border-gray-800 scale-125 opacity-0 group-hover:opacity-20 group-hover:scale-100 transition-all duration-700" />
          <span className="text-xs tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
            {isLoading ? 'THINKING' : 'THINK'}
          </span>
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        ::-webkit-scrollbar {
          width: 2px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}