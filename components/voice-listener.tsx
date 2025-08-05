'use client'

import { useRef, useState } from 'react'

interface VoiceListenerProps {
  onTranscript: (text: string) => void
  isProcessing: boolean
}

export function VoiceListener({ onTranscript, isProcessing }: VoiceListenerProps) {
  const [isListening, setIsListening] = useState(false)
  const [timeLeft, setTimeLeft] = useState(240) // 4 minutes in seconds
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/webm' })
        chunks.current = []
        
        // Convert to smaller format if needed
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
          } else {
            const error = await response.json()
            console.error('Transcription error:', error)
            alert('Transcription failed. Try a shorter recording.')
          }
        } catch (error) {
          console.error('Transcription error:', error)
        }
        
        setTimeLeft(240) // Reset timer
      }

      mediaRecorder.current.start(1000) // Collect data every second
      setIsListening(true)

      // Start countdown timer
      let seconds = 240
      timerRef.current = setInterval(() => {
        seconds--
        setTimeLeft(seconds)
        
        if (seconds <= 0) {
          stopListening()
        }
      }, 1000)

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
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeLeft(240)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center gap-2">
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
          {isListening ? 'Recording' : 'Speak'}
        </div>
        {isListening && (
          <>
            <div className="flex gap-1">
              <span className="w-1 h-3 bg-red-500/50 animate-pulse" />
              <span className="w-1 h-4 bg-red-500/50 animate-pulse" style={{ animationDelay: '0.1s' }} />
              <span className="w-1 h-2 bg-red-500/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 h-5 bg-red-500/50 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <div className="text-xs opacity-80 font-mono">
              {formatTime(timeLeft)}
            </div>
          </>
        )}
      </button>
      {isListening && (
        <div className="text-xs opacity-50">
          Max 4 minutes • Click to stop
        </div>
      )}
    </div>
  )
}
