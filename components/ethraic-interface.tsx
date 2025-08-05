'use client'

import { useState, useRef, useEffect } from 'react'
import { injectKeyframes } from '@/lib/visual-adaptations'
import { VoiceListener } from './voice-listener'

export function ETHRAICInterface() {
  const [mode, setMode] = useState<'personal' | 'team' | 'enterprise'>('personal')
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [metrics, setMetrics] = useState({ clarity: 0, depth: 0 })
  const [useVoice, setUseVoice] = useState(false)
  const [visualState, setVisualState] = useState({
    buttonStyles: {},
    particleConfig: { count: 8, speed: 0.2 },
    cssKeyframes: ''
  })

  const adaptVisuals = async (consciousnessData: any) => {
    try {
      const res = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consciousnessData)
      })
      if (!res.ok) return
      const data = await res.json()
      setVisualState(data)
      if (data.cssKeyframes) {
        injectKeyframes(data.cssKeyframes)
      }
    } catch (error) {
      console.error('Visual adapt error:', error)
    }
  }

  const think = async (text: string) => {
    if (!text.trim() || isProcessing) return
    setIsProcessing(true)
    setInput(text)
    try {
      const res = await fetch('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, mode })
      })
      const data = await res.json()
      setResponse(data.response)
      setMetrics({ clarity: data.clarity || 0, depth: data.depth || 0 })
      if (data.phase && data.metrics) {
        await adaptVisuals({
          phase: data.phase,
          metrics: data.metrics,
          emotional_tone: data.emotional_tone || 'neutral',
          urgency: data.urgency || 0
        })
      }
      setTimeout(() => {
        setResponse('')
        setMetrics({ clarity: 0, depth: 0 })
      }, 10000)
    } catch (error) {
      console.error('Think error:', error)
      setResponse('Connection error. Check your API keys.')
    } finally {
      setIsProcessing(false)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: visualState.particleConfig?.count || 30 }).map((_, i) => {
          const left = `${Math.random() * 100}%`
          const top = `${Math.random() * 100}%`
          const delay = `${Math.random() * 3}s`
          const speed = visualState.particleConfig?.speed || 0.2
          return (
            <div
              key={i}
              className="absolute w-px h-px bg-white animate-pulse-slow"
              style={{
                left,
                top,
                animationDelay: delay,
                animationDuration: `${(1 / speed).toFixed(1)}s`
              }}
            />
          )
        })}
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-8 text-sm tracking-[0.3em] opacity-60">
        ETHRAIC
      </div>

      {/* Mode Toggle */}
      <div className="absolute top-8 right-8 flex gap-2">
        {(['personal', 'team', 'enterprise'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 text-xs uppercase tracking-wider border transition-all ${
              mode === m
                ? 'border-white/30 bg-white/5'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Voice Toggle */}
      <button
        onClick={() => setUseVoice(!useVoice)}
        className="absolute top-20 right-8 px-3 py-1 text-xs uppercase tracking-wider border border-white/10 hover:border-white/20 transition-all"
      >
        {useVoice ? 'Voice On' : 'Voice Off'}
      </button>

      {/* Main Interface */}
      <div className="flex flex-col items-center gap-8 z-10">
        {/* Think Button or Voice Listener */}
        {useVoice ? (
          <VoiceListener onTranscript={think} isProcessing={isProcessing} />
        ) : (
          <button
            onClick={() => document.getElementById('input')?.focus()}
            className={`w-32 h-32 rounded-full border ${
              isProcessing
                ? 'border-white/50 animate-pulse'
                : 'border-white/20 hover:border-white/40'
            } flex items-center justify-center transition-all group`}
            style={visualState.buttonStyles as any}
          >
            <span className="text-xs uppercase tracking-widest opacity-60 group-hover:opacity-100">
              Think
            </span>
          </button>
        )}

        {/* Text Input */}
        {!useVoice && (
          <input
            id="input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && think(input)}
            placeholder={
              mode === 'personal'
                ? 'What are you thinking about?'
                : mode === 'team'
                ? 'What should we explore?'
                : 'What needs solving?'
            }
            className="w-[600px] bg-transparent border-b border-white/20 pb-2 text-center outline-none placeholder:text-white/20 focus:border-white/40 transition-colors"
            disabled={isProcessing}
          />
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse" />
            <span
              className="w-2 h-2 bg-white/50 rounded-full animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="w-2 h-2 bg-white/50 rounded-full animate-pulse"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="max-w-2xl text-center animate-fadeIn">
            <p className="text-lg leading-relaxed opacity-90">{response}</p>
          </div>
        )}
      </div>

      {/* Metrics */}
      {metrics.clarity > 0 && (
        <div className="absolute bottom-8 left-8 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-40">Clarity</div>
            <div className="text-2xl font-light">{(metrics.clarity * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-40">Depth</div>
            <div className="text-2xl font-light">{(metrics.depth * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="absolute bottom-8 right-8 text-[10px] uppercase tracking-wider opacity-30">
        {isProcessing ? 'Processing' : 'Ready'}
      </div>
    </div>
  )
}
