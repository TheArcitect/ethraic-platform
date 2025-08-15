'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Brain, Activity, Zap, Layers, ChevronRight, ChevronLeft, Menu, X, 
  BarChart3, History, Lightbulb, Settings, Mic, MicOff, User, Plus, 
  MessageCircle, FolderOpen, Star, Volume2, VolumeX, Type, Send,
  Headphones, Moon, Sun, LogOut, HelpCircle, Shield, CreditCard,
  Users, FileText, Download, Upload, Trash2, Archive, ChevronDown, ArrowUp,
  Share2, Edit2
} from 'lucide-react'
import { AudioHandler, type AudioHandlerRef } from './audio-handler'
import ThoughtCanvas from './thought-canvas'
import { ConsciousnessExpansionEngine } from '../lib/ethraic-engine'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  clarity?: number
  depth?: number
  condensed?: boolean
  threadId?: string
}

interface ThoughtThread {
  id: string
  title: string
  created: number
  lastActive: number
  messages: Message[]
  metrics?: any
  starred?: boolean
}

interface UserProfile {
  name: string
  email: string
  plan: 'Free' | 'Pro' | 'Max'
  avatar?: string
  preferences: {
    voiceEnabled: boolean
    theme: 'dark' | 'light'
    condensation: boolean
    particles: boolean
    autoSave: boolean
    coThinking: boolean
  }
}

export default function EthraicInterface() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [activeSection, setActiveSection] = useState('consciousness')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [displayedResponse, setDisplayedResponse] = useState('')
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  
  // Voice state
  const [voiceActive, setVoiceActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [preferTyping, setPreferTyping] = useState(false)
  const [coThinkingMode, setCoThinkingMode] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  // Thread management
  const [thoughtThreads, setThoughtThreads] = useState<ThoughtThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadSearch, setThreadSearch] = useState('')
  
  // User profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Michael Schaeffer',
    email: 'michael@ethraic.ai',
    plan: 'Max',
    preferences: {
      voiceEnabled: true,
      theme: 'dark',
      condensation: true,
      particles: true,
      autoSave: true,
      coThinking: false
    }
  })
  
  // Session tracking
  const [sessionStart] = useState(Date.now())
  const [sessionDuration, setSessionDuration] = useState(0)
  const [exchangeCount, setExchangeCount] = useState(0)
  
  // Mathematical engine
  const engineRef = useRef(new ConsciousnessExpansionEngine())
  const [metrics, setMetrics] = useState(engineRef.current.getState())
  const [breakthroughMetrics, setBreakthroughMetrics] = useState(engineRef.current.getBreakthroughMetrics())
  const [currentPhase, setCurrentPhase] = useState<string>('SURFACE')
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioHandlerRef = useRef<AudioHandlerRef>(null)
  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Initialize
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    setRightSidebarOpen(true)
    
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
        
        if (event.results[event.results.length - 1].isFinal) {
          handleVoiceInput(transcript)
        }
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedThreads = localStorage.getItem('ethraic_threads')
      if (savedThreads) {
        try {
          setThoughtThreads(JSON.parse(savedThreads))
        } catch (e) {
          console.error('Error loading saved threads:', e)
        }
      }
      
      const savedPreferences = localStorage.getItem('ethraic_preferences')
      if (savedPreferences) {
        try {
          setUserProfile(prev => ({
            ...prev,
            preferences: JSON.parse(savedPreferences)
          }))
        } catch (e) {
          console.error('Error loading preferences:', e)
        }
      }
    }
  }, [])

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
      if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.condensed) {
        const fullText = lastMessage.content || ''
        if (fullText && currentResponseIndex < fullText.length) {
          const timer = setTimeout(() => {
            setDisplayedResponse(fullText.substring(0, currentResponseIndex + 1))
            setCurrentResponseIndex(prev => prev + 1)
          }, 20)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [messages, currentResponseIndex])

  // Voice input handler
  const handleVoiceInput = useCallback((transcript: string) => {
    if (!transcript.trim()) return
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: transcript,
      timestamp: Date.now(),
      threadId: activeThreadId || undefined
    }
    
    setMessages(prev => [...prev, userMessage])
    processMessage(transcript)
  }, [activeThreadId])

  // Start/stop voice recognition
  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not available in your browser. Please use Chrome or Edge.')
      return
    }
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
      
      if (coThinkingMode) {
        recognitionRef.current.continuous = true
      }
    }
  }

  // Process message
  const processMessage = async (text: string) => {
    setIsThinking(true)
    setExchangeCount(prev => prev + 1)
    setDisplayedResponse('')
    setCurrentResponseIndex(0)

    try {
      const newMetrics = engineRef.current.calculateConsciousnessMetrics(
        text,
        messages.map(m => ({ role: m.role, content: m.content })),
        sessionDuration
      )
      setMetrics(newMetrics)
      
      const breakthroughs = engineRef.current.getBreakthroughMetrics()
      setBreakthroughMetrics(breakthroughs)
      
      const phase = engineRef.current.detectPhase()
      setCurrentPhase(phase)

      const response = await fetch('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          metrics: newMetrics,
          phase: phase,
          coThinking: coThinkingMode
        })
      })

      const data = await response.json()
      
      const aiMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        clarity: newMetrics.clarity,
        depth: newMetrics.depth,
        threadId: activeThreadId || undefined
      }

      setMessages(prev => [...prev, aiMessage])
      
      if (audioEnabled && audioHandlerRef.current) {
        audioHandlerRef.current.playAudio(data.response)
      }
      
      if (typeof window !== 'undefined' && window && (window as any).createThoughtCluster) {
        const intensity = newMetrics.paradigmShift / 30
        ;(window as any).createThoughtCluster(
          window.innerWidth / 2,
          window.innerHeight / 2,
          intensity
        )
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'I need a moment to recalibrate my thoughts... Please try again.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  // Text input handler
  const handleSendMessage = async () => {
    if (!input.trim() || isThinking) return
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
      threadId: activeThreadId || undefined
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    await processMessage(userMessage.content)
  }

  // Thread management
  const createNewThread = () => {
    const newThread: ThoughtThread = {
      id: `thread_${Date.now()}`,
      title: 'Untitled Thread',
      created: Date.now(),
      lastActive: Date.now(),
      messages: [],
      metrics: engineRef.current.getState(),
      starred: false
    }
    
    setThoughtThreads(prev => [...prev, newThread])
    setActiveThreadId(newThread.id)
    setMessages([])
    engineRef.current.reset()
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('ethraic_threads', JSON.stringify([...thoughtThreads, newThread]))
      } catch (e) {
        console.error('Error saving thread:', e)
      }
    }
  }

  const loadThread = (threadId: string) => {
    const thread = thoughtThreads.find(t => t.id === threadId)
    if (thread) {
      setActiveThreadId(threadId)
      setMessages(thread.messages)
      if (thread.metrics) {
        setMetrics(thread.metrics)
      }
    }
  }

  const saveCurrentThread = () => {
    if (!activeThreadId) {
      createNewThread()
      return
    }
    
    setThoughtThreads(prev => prev.map(thread => {
      if (thread.id === activeThreadId) {
        return {
          ...thread,
          messages,
          lastActive: Date.now(),
          metrics: engineRef.current.getState()
        }
      }
      return thread
    }))
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('ethraic_threads', JSON.stringify(thoughtThreads))
      } catch (e) {
        console.error('Error saving thread:', e)
      }
    }
  }

  const deleteThread = (threadId: string) => {
    setThoughtThreads(prev => prev.filter(t => t.id !== threadId))
    if (activeThreadId === threadId) {
      setActiveThreadId(null)
      setMessages([])
      engineRef.current.reset()
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('ethraic_threads', JSON.stringify(thoughtThreads.filter(t => t.id !== threadId)))
      } catch (e) {
        console.error('Error deleting thread:', e)
      }
    }
  }

  // Preference handlers
  const updatePreference = (key: keyof UserProfile['preferences'], value: any) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('ethraic_preferences', JSON.stringify({
          ...userProfile.preferences,
          [key]: value
        }))
      } catch (e) {
        console.error('Error saving preferences:', e)
      }
    }
  }

  // Utility functions
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Render metrics content for Thought Metrics section
  const renderMetricsContent = () => {
    if (activeSection === 'metrics' && leftSidebarOpen) {
      return (
        <div 
          className="absolute top-14 left-64 bg-gray-950 border border-gray-800 rounded-lg p-6 w-80 z-30 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setActiveSection('consciousness')}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-300"
          >
            <X size={14} />
          </button>
          
          <h3 className="text-sm font-thin text-white mb-4 tracking-[0.2em] uppercase">Thought Metrics</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Mental Clarity</span>
                <span className="text-xs text-white">{metrics.clarity}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-500" style={{ width: `${metrics.clarity}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">How clear and focused your thoughts are</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Thinking Depth</span>
                <span className="text-xs text-white">{metrics.depth}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-500" style={{ width: `${metrics.depth}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">How deeply you're exploring the topic</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Creative Flow</span>
                <span className="text-xs text-white">{metrics.flowState}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-500" style={{ width: `${metrics.flowState}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Your state of effortless concentration</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Breakthrough Potential</span>
                <span className="text-xs text-white">{metrics.paradigmShift}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-500" style={{ width: `${metrics.paradigmShift}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Likelihood of a major insight</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Pattern Recognition</span>
                <span className="text-xs text-white">{metrics.resonance}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 transition-all duration-500" style={{ width: `${metrics.resonance}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Your ability to see connections</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500">
              <p>Current Phase: <span className="text-white">{currentPhase}</span></p>
              <p className="mt-1">Session Time: <span className="text-white">{formatDuration(sessionDuration)}</span></p>
              <p className="mt-1">Exchanges: <span className="text-white">{exchangeCount}</span></p>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
        
        @font-face {
          font-family: 'ETHRAIC';
          src: local('Inter'), local('system-ui'), local('-apple-system'), local('BlinkMacSystemFont');
          font-weight: 100;
          letter-spacing: 0.4em;
        }
      `}</style>

      {/* LEFT Sidebar - Gray tones */}
      <div className={`${leftSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden relative z-20`}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className={`p-4 border-b border-gray-800 ${!leftSidebarOpen ? 'flex justify-center' : ''}`}>
            <h1 className={`font-thin tracking-[0.4em] text-white font-['Inter'] ${leftSidebarOpen ? 'text-base' : 'text-xs'}`}>
              {leftSidebarOpen ? 'ETHRAIC' : 'E'}
            </h1>
          </div>

          {/* Navigation - Consciousness first */}
          <nav className={`${leftSidebarOpen ? 'px-4' : 'px-2'} py-4 space-y-1 border-b border-gray-800`}>
            <button 
              onClick={() => setActiveSection('consciousness')}
              className={`w-full flex items-center ${leftSidebarOpen ? 'gap-3 px-3' : 'justify-center px-1'} py-2 rounded-lg transition-colors ${
                activeSection === 'consciousness' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'
              }`}
              title={!leftSidebarOpen ? 'Consciousness' : ''}
            >
              <Brain size={14} />
              {leftSidebarOpen && <span className="text-xs font-thin">Consciousness</span>}
            </button>
            
            <button 
              onClick={() => setActiveSection('metrics')}
              className={`w-full flex items-center ${leftSidebarOpen ? 'gap-3 px-3' : 'justify-center px-1'} py-2 rounded-lg transition-colors ${
                activeSection === 'metrics' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'
              }`}
              title={!leftSidebarOpen ? 'Thought Metrics' : ''}
            >
              <BarChart3 size={14} />
              {leftSidebarOpen && <span className="text-xs font-thin">Thought Metrics</span>}
            </button>
            
            <button 
              onClick={() => setActiveSection('history')}
              className={`w-full flex items-center ${leftSidebarOpen ? 'gap-3 px-3' : 'justify-center px-1'} py-2 rounded-lg transition-colors ${
                activeSection === 'history' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'
              }`}
              title={!leftSidebarOpen ? 'History' : ''}
            >
              <History size={14} />
              {leftSidebarOpen && <span className="text-xs font-thin">History</span>}
            </button>
            
            <button 
              onClick={() => setActiveSection('insights')}
              className={`w-full flex items-center ${leftSidebarOpen ? 'gap-3 px-3' : 'justify-center px-1'} py-2 rounded-lg transition-colors ${
                activeSection === 'insights' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'
              }`}
              title={!leftSidebarOpen ? 'Insights' : ''}
            >
              <Lightbulb size={14} />
              {leftSidebarOpen && <span className="text-xs font-thin">Insights</span>}
            </button>
            
            <button 
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center ${leftSidebarOpen ? 'gap-3 px-3' : 'justify-center px-1'} py-2 rounded-lg transition-colors ${
                activeSection === 'settings' 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-300'
              }`}
              title={!leftSidebarOpen ? 'Settings' : ''}
            >
              <Settings size={14} />
              {leftSidebarOpen && <span className="text-xs font-thin">Settings</span>}
            </button>
          </nav>

          {/* Thought Threads Section - Now scrollable */}
          <div className={`flex-1 ${leftSidebarOpen ? 'px-4' : 'px-2'} py-4 overflow-y-auto`}>
            {leftSidebarOpen && (
              <>
                <div className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-3 font-thin">
                  Thought Threads
                </div>
                
                {/* New Thread Button */}
                <button 
                  onClick={createNewThread}
                  className="w-full px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-all border border-gray-800 mb-3"
                >
                  <Plus size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-400 font-thin">New thought thread</span>
                </button>

                {/* Thread List */}
                <div className="space-y-1">
                  {thoughtThreads
                    .sort((a, b) => {
                      // Starred threads first
                      if (a.starred && !b.starred) return -1
                      if (!a.starred && b.starred) return 1
                      // Then by last active
                      return b.lastActive - a.lastActive
                    })
                    .map(thread => (
                    <div
                      key={thread.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        activeThreadId === thread.id ? 'bg-gray-900' : 'hover:bg-gray-900/50'
                      }`}
                    >
                      {thread.starred && <Star size={10} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      <button
                        onClick={() => loadThread(thread.id)}
                        className="flex-1 text-left text-xs text-gray-400 truncate"
                      >
                        {thread.title}
                      </button>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const newName = prompt('Rename thread:', thread.title)
                            if (newName) {
                              setThoughtThreads(prev => prev.map(t => 
                                t.id === thread.id ? { ...t, title: newName } : t
                              ))
                            }
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                          title="Rename"
                        >
                          <Edit2 size={10} className="text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Share functionality
                            navigator.clipboard.writeText(`https://ethraic.ai/thread/${thread.id}`)
                            alert('Share link copied to clipboard!')
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                          title="Share"
                        >
                          <Share2 size={10} className="text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteThread(thread.id)
                          }}
                          className="p-1 hover:bg-gray-800 rounded"
                          title="Delete"
                        >
                          <Trash2 size={10} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="border-t border-gray-800 p-4">
            {leftSidebarOpen ? (
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-full flex items-center gap-3 hover:bg-gray-900 p-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs font-thin text-gray-400">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs text-gray-400 font-thin">{userProfile.name}</div>
                  <div className="text-xs text-gray-600 font-thin">{userProfile.plan} plan</div>
                </div>
                <ChevronDown size={12} className={`text-gray-600 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs font-thin text-gray-400">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-gray-900 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="text-gray-500 hover:text-gray-400 transition-colors p-2 rounded"
              title="Toggle menu"
            >
              {leftSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
            </button>
            <span className="text-xs text-gray-600 font-thin tracking-[0.3em] uppercase">
              Thought Thread
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isListening && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording
              </div>
            )}
            <button className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Share
            </button>
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="text-gray-500 hover:text-gray-400 transition-colors"
              title="Toggle voice panel"
            >
              {rightSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <div className="flex-1 relative overflow-hidden">
          {userProfile.preferences.particles && <ThoughtCanvas />}
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-8">
            {/* Logo */}
            <h1 className="text-5xl font-thin tracking-[0.4em] mb-4 text-white">
              ETHRAIC
            </h1>
            
            {/* Metrics */}
            <div className="text-xs text-gray-500 tracking-[0.2em] mb-8 uppercase font-thin">
              CLARITY: {metrics.clarity}% | DEPTH: {metrics.depth}%
            </div>

            <div className="text-xs text-gray-600 tracking-[0.3em] mb-8 uppercase font-thin">
              GET TO THE POINT FASTER
            </div>

            {/* Messages Area */}
            <div className="w-full max-w-3xl h-[400px] mb-8">
              <div className="h-full overflow-y-auto space-y-4 px-4">
                {messages.map((message, index) => {
                  const isLastAssistant = index === messages.length - 1 && message.role === 'assistant'
                  const displayContent = isLastAssistant && !message.condensed ? (displayedResponse || message.content || '') : (message.content || '')
                  
                  return (
                    <div
                      key={message.id}
                      className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      <div
                        className={`inline-block px-4 py-2 rounded-lg max-w-lg ${
                          message.role === 'user'
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300'
                        } ${message.condensed ? 'opacity-30' : ''}`}
                      >
                        {displayContent}
                        {isLastAssistant && displayedResponse && message.content && displayedResponse.length < message.content.length && (
                          <span className="inline-block w-1 h-3 bg-gray-500 animate-pulse ml-1" />
                        )}
                      </div>
                    </div>
                  )
                })}
                {isThinking && (
                  <div className="text-left">
                    <div className="inline-block px-4 py-2 text-gray-600">
                      <span className="animate-pulse font-thin">expanding consciousness...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Modern Input Area */}
            <div className="w-full max-w-3xl mb-8">
              <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleVoiceRecognition}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening ? 'bg-red-900/50 text-red-400' : 'hover:bg-gray-800 text-gray-500'
                    }`}
                    title="Voice input"
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="What are you thinking about?"
                    className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm font-thin"
                    disabled={isThinking}
                  />
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={isThinking || !input.trim()}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    title="Send message"
                  >
                    <ArrowUp size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Mode Button */}
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="px-6 py-2 bg-transparent border border-gray-800 rounded-full hover:border-gray-600 transition-all flex items-center gap-3"
            >
              <Mic size={12} className="text-gray-600" />
              <span className="text-xs text-gray-600 uppercase tracking-[0.2em] font-thin">
                OPEN VOICE MODE
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Explorer Bar */}
        <div className="h-12 border-t border-gray-900 flex items-center px-6">
          <div className="flex items-center gap-2 text-gray-700">
            <User size={12} />
            <span className="text-xs uppercase tracking-[0.2em] font-thin">EXPLORER</span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-700 font-thin">
            <span>Session: {formatDuration(sessionDuration)}</span>
            <span>Exchanges: {exchangeCount}</span>
            {currentPhase && (
              <span className="text-gray-500">Phase: {currentPhase}</span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT Sidebar - Voice Panel (Gray) */}
      <div className={`${rightSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-950 border-l border-gray-800 flex flex-col overflow-hidden relative`}
           style={{ minWidth: rightSidebarOpen ? '320px' : '0', maxWidth: rightSidebarOpen ? '320px' : '0' }}>
        
        <button
          onClick={() => setRightSidebarOpen(false)}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 z-10"
        >
          <X size={16} />
        </button>
        
        <div className="h-full flex items-center justify-center p-8">
          <div className="flex flex-col items-center justify-center space-y-8 w-full">
            <h2 className="text-2xl font-thin text-white tracking-[0.3em] uppercase text-center">
              SPEAK TO EXPAND
            </h2>
            
            <button
              onClick={toggleVoiceRecognition}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                isListening 
                  ? 'bg-gray-800 animate-pulse shadow-lg shadow-gray-800/50' 
                  : 'bg-gray-900 hover:bg-gray-800 border border-gray-800'
              }`}
            >
              <Mic size={48} className={isListening ? 'text-white' : 'text-gray-500'} />
            </button>
            
            <h2 className="text-lg font-thin text-gray-400 tracking-[0.2em] uppercase text-center">
              {isListening ? 'LISTENING...' : 'TAP TO SPEAK'}
            </h2>
            
            <button
              onClick={() => {
                setPreferTyping(true)
                setRightSidebarOpen(false)
              }}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors underline font-thin"
            >
              Prefer to type or journal
            </button>
            
            <div className="w-full max-w-xs p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={coThinkingMode}
                  onChange={(e) => {
                    setCoThinkingMode(e.target.checked)
                    updatePreference('coThinking', e.target.checked)
                  }}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  coThinkingMode ? 'bg-gray-700' : 'bg-gray-800'
                } relative`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-gray-400 transition-transform ${
                    coThinkingMode ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
                <span className="text-xs text-gray-400 font-thin">Co-thinking Mode</span>
              </label>
              <p className="text-xs text-gray-500 mt-2 font-thin text-center">
                Think out loud together in continuous conversation
              </p>
            </div>
            
            {isListening && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Panel Overlay */}
      {renderMetricsContent()}

      {/* Sidebar Toggle Button - Show when both sidebars are closed */}
      {!leftSidebarOpen && !rightSidebarOpen && (
        <button
          onClick={() => setLeftSidebarOpen(true)}
          className="fixed bottom-4 left-4 p-3 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors z-30"
          title="Open sidebar"
        >
          <Menu size={16} className="text-gray-500" />
        </button>
      )}
    </div>
  )
}