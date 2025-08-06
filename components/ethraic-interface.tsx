'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Brain } from 'lucide-react'

interface ConversationItem {
  id: string
  question: string
  response: string
  clarity: number
  depth: number
  timestamp: Date
}

export function EthraicInterface() {
  const [query, setQuery] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const conversationContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest response
  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  const handleThink = async () => {
    if (!query.trim()) return

    setIsThinking(true)
    
    try {
      const response = await fetch('/api/ethraic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await response.json()
      
      // Add new conversation item to history
      const newItem: ConversationItem = {
        id: Date.now().toString(),
        question: query,
        response: data.response,
        clarity: data.clarity,
        depth: data.depth,
        timestamp: new Date()
      }
      
      setConversationHistory(prev => [...prev, newItem])
      setQuery('') // Clear input after successful response
    } catch (error) {
      console.error('Error:', error)
      // Optionally add error handling to conversation history
      const errorItem: ConversationItem = {
        id: Date.now().toString(),
        question: query,
        response: 'An error occurred while processing your request.',
        clarity: 0,
        depth: 0,
        timestamp: new Date()
      }
      setConversationHistory(prev => [...prev, errorItem])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-black border-white/20 text-white p-8">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8" />
          <h1 className="text-3xl font-light tracking-wider">ETHRAIC</h1>
        </div>
        
        {/* Conversation History Container */}
        <div 
          ref={conversationContainerRef}
          className="conversation-container overflow-y-auto pr-2"
          style={{ 
            maxHeight: '70vh',
            minHeight: '200px'
          }}
        >
          {conversationHistory.length === 0 ? (
            <div className="text-white/50 text-center py-12">
              Ask ETHRAIC anything...
            </div>
          ) : (
            <div className="space-y-8">
              {conversationHistory.map((item) => (
                <div key={item.id} className="space-y-3">
                  {/* User Question */}
                  <div className="text-white/70">
                    <span className="font-medium">You: </span>
                    {item.question}
                  </div>
                  
                  {/* ETHRAIC Response */}
                  <div className="text-white pl-4 border-l-2 border-white/20">
                    {item.response}
                  </div>
                  
                  {/* Metrics */}
                  <div className="flex gap-4 text-sm text-white/50 pl-4">
                    <span>Clarity: {item.clarity}%</span>
                    <span>Depth: {item.depth}%</span>
                  </div>
                </div>
              ))}
              <div ref={conversationEndRef} />
            </div>
          )}
        </div>
        
        {/* Input and Button Container */}
        <div className="space-y-4 pt-4 border-t border-white/20">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isThinking && handleThink()}
            placeholder="Enter your query..."
            className="bg-black/50 border-white/30 text-white placeholder:text-white/40 
                     focus:border-white/60 transition-colors"
            disabled={isThinking}
          />
          
          <Button
            onClick={handleThink}
            disabled={isThinking || !query.trim()}
            className="w-full bg-white text-black hover:bg-white/90 
                     disabled:bg-white/20 disabled:text-white/40 
                     font-light tracking-wider transition-all duration-300"
          >
            {isThinking ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse">THINKING</span>
                <span className="animate-spin">◐</span>
              </span>
            ) : (
              'THINK'
            )}
          </Button>
        </div>
      </div>
      
      <style jsx>{`
        .conversation-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        .conversation-container::-webkit-scrollbar {
          width: 2px;
        }
        
        .conversation-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .conversation-container::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 1px;
        }
        
        .conversation-container::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </Card>
  )
}
