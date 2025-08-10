'use client'

import { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface AudioHandlerProps {
  enabled: boolean
  onToggle: () => void
}

export interface AudioHandlerRef {
  playAudio: (text: string) => Promise<void>
}

export const AudioHandler = forwardRef<AudioHandlerRef, AudioHandlerProps>(
  ({ enabled, onToggle }, ref) => {
    const [isGenerating, setIsGenerating] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const playAudio = async (text: string) => {
      if (!enabled) return
      
      setIsGenerating(true)
      try {
        const response = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        
        if (!response.ok) throw new Error('Audio generation failed')
        
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        
        audioRef.current = new Audio(audioUrl)
        await audioRef.current.play()
        
        audioRef.current.addEventListener('ended', () => {
          URL.revokeObjectURL(audioUrl)
          setIsGenerating(false)
        })
      } catch (error) {
        console.error('Audio playback error:', error)
        setIsGenerating(false)
      }
    }

    useImperativeHandle(ref, () => ({
      playAudio
    }))

    return (
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-all ${
            enabled 
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
              : 'bg-gray-700/50 text-gray-500 hover:bg-gray-700'
          }`}
          title={enabled ? 'Disable voice' : 'Enable voice'}
        >
          {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        
        {isGenerating && (
          <div className="flex items-center gap-2">
            <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-xs text-blue-300">Generating voice...</span>
          </div>
        )}
      </div>
    )
  }
)

AudioHandler.displayName = 'AudioHandler'