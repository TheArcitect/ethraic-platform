'use client'

import { useRef, useState } from 'react'

interface VoiceListenerProps {
  onTranscript: (text: string) => void
  isProcessing: boolean
}

export function VoiceListener({ onTranscript, isProcessing }: VoiceListenerProps) {
  const [isListening, setIsListening] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/webm' })
        chunks.current = []
        
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')
        
        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            const { text } = await response.json()
            if (text) onTranscript(text)
          }
        } catch (error) {
          console.error('Transcription error:', error)
        }
      }

      mediaRecorder.current.start()
      setIsListening(true)

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.current?.state === 'recording') {
          stopListening()
        }
      }, 10000)
    } catch (error) {
      console.error('Microphone error:', error)
      alert('Please allow microphone access')
    }
  }

  const stopListening = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsListening(false)
    }
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      disabled={isProcessing}
      className={`w-32 h-32 rounded-full border transition-all ${
        isListening 
          ? 'border-red-500/50 bg-red-500/10 animate-pulse' 
          : isProcessing
          ? 'border-white/20 opacity-50'
          : 'border-white/20 hover:border-white/40'
      } flex flex-col items-center justify-center gap-2`}
    >
      <div className="text-xs uppercase tracking-widest opacity-60">
        {isListening ? 'Listening' : 'Speak'}
      </div>
      {isListening && (
        <div className="flex gap-1">
          <span className="w-1 h-3 bg-red-500/50 animate-pulse" />
          <span className="w-1 h-4 bg-red-500/50 animate-pulse" style={{ animationDelay: '0.1s' }} />
          <span className="w-1 h-2 bg-red-500/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-1 h-5 bg-red-500/50 animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
      )}
    </button>
  )
}
