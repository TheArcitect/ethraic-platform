'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Brain, Activity, Zap, Layers, ChevronRight, Menu, X, BarChart3, History, Lightbulb, Settings, Mic, MicOff } from 'lucide-react'
import { AudioHandler, type AudioHandlerRef } from './audio-handler'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  clarity?: number
  depth?: number
  condensed?: boolean
}

interface Metrics {
  clarity: number
  depth: number
  resonance: number
  emergence: number
  paradigmShift: number
  flowState: number
  insightVelocity: number
  questionQuality: number
  conceptualLeaps: number
  attentionCoherence: number
}

export default function EthraicInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({
    clarity: 50,
    depth: 50,
    resonance: 0,
    emergence: 0,
    paradigmShift: 0,
    flowState: 0,
    insightVelocity: 0,
    questionQuality: 0,
    conceptualLeaps: 0,
    attentionCoherence: 0
  })
  const [activeSection, setActiveSection] = useState('consciousness')
  const [sessionStart] = useState(Date.now())
  const [sessionDuration, setSessionDuration] = useState(0)
  const [exchangeCount, setExchangeCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [displayedResponse, setDisplayedResponse] = useState('')
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0)
  const [voiceActive, setVoiceActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const audioHandlerRef = useRef<AudioHandlerRef>(null)

  // Update session duration
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStart) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStart])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayedResponse])

  // Typewriter effect
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && !lastMessage.condensed) {
        const fullText = lastMessage.content
        if (currentResponseIndex < fullText.length) {
          const timer = setTimeout(() => {
            setDisplayedResponse(fullText.substring(0, currentResponseIndex + 1))
            setCurrentResponseIndex(prev => prev + 1)
          }, 20)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [messages, currentResponseIndex])

  // Thought condensation
  useEffect(() => {
    const condensationTimer = setInterval(() => {
      setMessages(prev => prev.map(msg => {
        const age = Date.now() - msg.timestamp
        if (age > 30000 && !msg.condensed) {
          return { ...msg, condensed: true }
        }
        return msg
      }))
    }, 5000)
    
    return () => clearInterval(condensationTimer)
  }, [])

  const calculateMetrics = (response: any, messageCount: number) => {
    const baseMetrics = {
      clarity: response.clarity || 0,
      depth: response.depth || 0,
      resonance: Math.min(100, (response.clarity + response.depth) / 2),
      emergence: Math.random() * 30 + (response.depth * 0.7),
      paradigmShift: response.phase === 'INTEGRATION' ? 85 : response.phase === 'DEEP' ? 60 : 30,
      flowState: Math.min(100, messageCount * 10 + response.depth * 0.5),
      insightVelocity: Math.min(100, (response.clarity * 0.6 + messageCount * 5)),
      questionQuality: response.depth * 0.8 + Math.random() * 20,
      conceptualLeaps: Math.floor(response.depth / 25) + (response.phase === 'INTEGRATION' ? 2 : 0),
      attentionCoherence: Math.min(100, 50 + response.clarity * 0.3 + response.depth * 0.2)
    }
    
    setMetrics(prev => ({
      clarity: Math.round((prev.clarity * 0.7 + baseMetrics.clarity * 0.3)),
      depth: Math.round((prev.depth * 0.7 + baseMetrics.depth * 0.3)),
      resonance: Math.round(baseMetrics.resonance),
      emergence: Math.round(baseMetrics.emergence),
      paradigmShift: Math.round(baseMetrics.paradigmShift),
      flowState: Math.round(baseMetrics.flowState),
      insightVelocity: Math.round(baseMetrics.insightVelocity),
      questionQuality: Math.round(baseMetrics.questionQuality),
      conceptualLeaps: baseMetrics.conceptualLeaps,
      attentionCoherence: Math.round(baseMetrics.attentionCoherence)
    }))
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsThinking(true)
    setExchangeCount(prev => prev + 1)
    setDisplayedResponse('')
    setCurrentResponseIndex(0)

    try {
      const response = await fetch('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        clarity: data.clarity,
        depth: data.depth
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Play audio response
      if (audioHandlerRef.current) {
        audioHandlerRef.current.playAudio(data.response)
      }
      
      calculateMetrics(data, exchangeCount + 1)
      
      // Trigger visual effect
      if (typeof window !== 'undefined' && (window as any).createThoughtCluster) {
        const intensity = data.depth / 100
        ;(window as any).createThoughtCluster(
          window.innerWidth / 2,
          window.innerHeight / 2,
          intensity * 3
        )
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I need a moment to gather my thoughts... Please try again.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMetricDescription = (metric: string, value: number) => {
    const descriptions: Record<string, string> = {
      clarity: value > 70 ? "Crystal clear understanding emerging" : value > 40 ? "Thoughts organizing into patterns" : "Exploring conceptual space",
      depth: value > 70 ? "Profound depths reached" : value > 40 ? "Diving below surface thoughts" : "Beginning descent into meaning",
      resonance: value > 70 ? "Strong harmonic alignment" : value > 40 ? "Patterns synchronizing" : "Seeking resonant frequency",
      emergence: value > 70 ? "New insights crystallizing" : value > 40 ? "Unexpected connections forming" : "Latent patterns activating",
      paradigmShift: value > 70 ? "Breakthrough imminent" : value > 40 ? "Perspective shifting" : "Foundations examining",
      flowState: value > 70 ? "Optimal flow achieved" : value > 40 ? "Entering flow channel" : "Building momentum",
      insightVelocity: value > 70 ? "Rapid insight generation" : value > 40 ? "Accelerating understanding" : "Gathering cognitive speed",
      questionQuality: value > 70 ? "Asking profound questions" : value > 40 ? "Questions deepening" : "Curiosity awakening",
      conceptualLeaps: value > 2 ? "Making breakthrough connections" : value > 0 ? "Jumping across domains" : "Building bridges",
      attentionCoherence: value > 70 ? "Laser-focused awareness" : value > 40 ? "Attention crystallizing" : "Gathering focus"
    }
    return descriptions[metric] || "Calibrating..."
  }

  const MetricBar = ({ label, value, description }: { label: string, value: number, description: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-gray-500">{value}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 italic">{description}</p>
    </div>
  )

  const renderSidebarContent = () => {
    switch(activeSection) {
      case 'metrics':
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Consciousness Metrics</h2>
            <div className="space-y-4">
              <MetricBar 
                label="Clarity" 
                value={metrics.clarity} 
                description={getMetricDescription('clarity', metrics.clarity)}
              />
              <MetricBar 
                label="Depth" 
                value={metrics.depth}
                description={getMetricDescription('depth', metrics.depth)}
              />
              <MetricBar 
                label="Resonance" 
                value={metrics.resonance}
                description={getMetricDescription('resonance', metrics.resonance)}
              />
              <MetricBar 
                label="Paradigm Shift" 
                value={metrics.paradigmShift}
                description={getMetricDescription('paradigmShift', metrics.paradigmShift)}
              />
            </div>
          </div>
        )
      
      case 'history':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Thought History</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.map((msg, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {msg.role === 'user' ? 'You' : 'ETHRAIC'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'insights':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Key Insights</h2>
            <div className="space-y-4">
              {metrics.paradigmShift > 60 && (
                <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-lg font-semibold text-white mb-2">🎯 Paradigm Shift Detected</h3>
                  <p className="text-sm text-gray-300">
                    Your thinking has reached a transformative threshold.
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Voice Responses</span>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    audioEnabled ? 'bg-blue-500' : 'bg-gray-600'
                  } relative`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    audioEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Particle canvas background */}
      <div className="absolute inset-0 z-0" />
      
      {/* Top left corner - ETHRAIC branding with menu */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          <Menu size={16} className="text-gray-400" />
        </button>
        <span className="text-sm text-gray-400 tracking-wider">ETHRAIC</span>
      </div>

      {/* Main centered interface */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8">
        {/* Title */}
        <h1 className="text-6xl font-extralight tracking-[0.3em] mb-4">ETHRAIC</h1>
        
        {/* Metrics */}
        <div className="text-xs text-gray-500 tracking-wider mb-12">
          CLARITY: {metrics.clarity}% | DEPTH: {metrics.depth}%
        </div>

        {/* Messages or GET TO THE POINT */}
        <div className="w-full max-w-2xl h-[300px] flex items-center justify-center mb-12">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-600 tracking-[0.2em]">GET TO THE POINT</p>
          ) : (
            <div className="w-full max-h-full overflow-y-auto space-y-4 px-4">
              {messages.map((message, index) => {
                const isLastAssistant = index === messages.length - 1 && message.role === 'assistant'
                const displayContent = isLastAssistant && !message.condensed ? displayedResponse : message.content
                
                return (
                  <div
                    key={index}
                    className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-lg max-w-lg ${
                        message.role === 'user'
                          ? 'bg-white/10 text-white'
                          : 'text-gray-300'
                      } ${message.condensed ? 'opacity-30' : ''}`}
                    >
                      {displayContent}
                      {isLastAssistant && displayedResponse.length < message.content.length && (
                        <span className="inline-block w-1 h-3 bg-gray-400 animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                )
              })}
              {isThinking && (
                <div className="text-left">
                  <div className="inline-block px-4 py-2 text-gray-500">
                    <span className="animate-pulse">thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="w-full max-w-2xl mb-8">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="What are you thinking about?"
              className="w-full bg-transparent border-b border-gray-800 text-white text-center pb-2 pr-20 focus:outline-none focus:border-gray-600 placeholder-gray-700 text-sm"
              disabled={isThinking}
            />
            <button
              onClick={handleSendMessage}
              disabled={isThinking || !input.trim()}
              className="absolute right-0 bottom-2 text-gray-500 hover:text-white transition-colors disabled:opacity-30 text-xs tracking-wider"
            >
              THINK
            </button>
          </div>
        </div>

        {/* Voice buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setVoiceActive(!voiceActive)}
            className="px-4 py-2 bg-transparent border border-gray-800 rounded-full hover:border-gray-600 transition-colors flex items-center gap-2"
          >
            <Mic size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400 tracking-wider">SPEAK TO ETHRAIC</span>
          </button>
          
          <AudioHandler 
            ref={audioHandlerRef}
            enabled={audioEnabled} 
            onToggle={() => setAudioEnabled(!audioEnabled)} 
          />
          
          <button
            onClick={() => setVoiceActive(!voiceActive)}
            className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
              voiceActive 
                ? 'bg-blue-500/20 border border-blue-500/50' 
                : 'bg-transparent border border-gray-800'
            }`}
          >
            <Mic size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400 tracking-wider">ACTIVATE VOICE</span>
          </button>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-8 text-xs text-gray-700 tracking-wider">
          CLICK TO ACTIVATE
        </div>
      </div>

      {/* Overlay Sidebar */}
      <div className={`fixed left-0 top-0 h-full ${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-900/95 backdrop-blur border-r border-gray-800 overflow-hidden z-30`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ETHRAIC
            </h1>
            <p className="text-xs text-gray-500 mt-1">Consciousness Expansion Platform</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {activeSection === 'consciousness' ? (
          <nav className="p-4">
            <div className="space-y-2">
              {[
                { id: 'consciousness', label: 'Consciousness', icon: Brain },
                { id: 'metrics', label: 'Metrics', icon: BarChart3 },
                { id: 'history', label: 'History', icon: History },
                { id: 'insights', label: 'Insights', icon: Lightbulb },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === id 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{label}</span>
                  {activeSection === id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              ))}
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Session Time</span>
                <span className="text-xs text-gray-400 font-mono">{formatDuration(sessionDuration)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Exchanges</span>
                <span className="text-xs text-gray-400 font-mono">{exchangeCount}</span>
              </div>
            </div>
          </nav>
        ) : (
          <div className="h-full overflow-y-auto">
            <button
              onClick={() => setActiveSection('consciousness')}
              className="m-4 text-gray-400 hover:text-white flex items-center gap-2"
            >
              <ChevronRight size={16} className="rotate-180" />
              <span className="text-sm">Back</span>
            </button>
            {renderSidebarContent()}
          </div>
        )}
      </div>
    </div>
  )
}