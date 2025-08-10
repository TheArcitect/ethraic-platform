'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface RealtimeVoiceProps {
  onTranscription?: (text: string) => void
  onAIResponse?: (text: string) => void
}

export default function RealtimeVoice({ onTranscription, onAIResponse }: RealtimeVoiceProps) {
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sessionConfigured = useRef(false)

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('Cleaning up Realtime connection...');
    
    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    sessionConfigured.current = false;
    setIsListening(false);
    setStatus('idle');
  }, []);

  // Connect to Realtime API
  const connectToRealtime = useCallback(async () => {
    try {
      setStatus('connecting');
      setErrorMessage('');
      
      // Step 1: Get ephemeral token from our backend
      console.log('Getting ephemeral token...');
      const sessionResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const { client_secret } = await sessionResponse.json();
      console.log('Got ephemeral token');

      // Step 2: Connect to WebSocket with token in URL
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
      console.log('Connecting to Realtime WebSocket...');
      
      const ws = new WebSocket(wsUrl, [], {
        headers: {
          'Authorization': `Bearer ${client_secret}`,
          'OpenAI-Beta': 'realtime=v1',
        }
      } as any);
      
      // For browser compatibility, we need to send auth after connection
      ws.onopen = () => {
        console.log('WebSocket opened, sending authentication...');
        
        // Send session update with auth token
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            model: 'gpt-4o-realtime-preview-2024-12-17',
            voice: 'alloy',
            instructions: `You are ETHRAIC, a consciousness expansion interface. You help humans explore paradigm shifts and see through mental fog. Your responses should be profound yet clear, like consciousness observing itself. Be concise and insightful.`,
            input_audio_transcription: {
              enabled: true,
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        }));
        
        setStatus('connected');
        console.log('ETHRAIC personality configured');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Realtime event:', data.type);

          switch (data.type) {
            case 'error':
              console.error('Realtime API error:', data.error);
              setErrorMessage(data.error?.message || 'Unknown error');
              setStatus('error');
              break;

            case 'session.created':
              console.log('Session created successfully');
              sessionConfigured.current = true;
              break;

            case 'session.updated':
              console.log('Session updated successfully');
              break;

            case 'conversation.item.created':
              if (data.item?.role === 'user' && data.item?.content?.[0]?.transcript) {
                const transcript = data.item.content[0].transcript;
                console.log('User said:', transcript);
                if (onTranscription) {
                  onTranscription(transcript);
                }
              }
              break;

            case 'response.audio_transcript.delta':
              if (data.delta) {
                console.log('AI speaking:', data.delta);
                if (onAIResponse) {
                  onAIResponse(data.delta);
                }
              }
              break;

            case 'response.audio_transcript.done':
              if (data.transcript) {
                console.log('AI complete response:', data.transcript);
              }
              break;

            case 'response.done':
              console.log('Response complete');
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setErrorMessage('Connection error occurred');
        setStatus('error');
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code}`, event.reason);
        if (event.code === 3000) {
          setErrorMessage('Authentication failed - check API key');
        } else if (event.code !== 1000) {
          setErrorMessage(`Connection closed: ${event.reason || 'Unknown reason'}`);
        }
        cleanup();
      };

      wsRef.current = ws;

      // Step 3: Set up audio capture after WebSocket is ready
      setTimeout(async () => {
        if (ws.readyState === WebSocket.OPEN && sessionConfigured.current) {
          await startAudioCapture();
        }
      }, 500);

    } catch (error: any) {
      console.error('Failed to connect to Realtime:', error);
      setErrorMessage(error.message || 'Failed to connect');
      setStatus('error');
      cleanup();
    }
  }, [cleanup, onTranscription, onAIResponse]);

  // Start audio capture
  const startAudioCapture = async () => {
    try {
      console.log('Starting audio capture...');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000 // Realtime API expects 24kHz
        } 
      });
      
      mediaStreamRef.current = stream;
      
      // Create audio context with correct sample rate
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array (PCM16)
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Convert to base64
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          
          // Send audio chunk to Realtime API
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      
      console.log('Audio capture started successfully');
      setIsListening(true);
      
    } catch (error: any) {
      console.error('Failed to start audio capture:', error);
      setErrorMessage(error.message || 'Microphone access denied');
      setStatus('error');
    }
  };

  // Toggle voice activation
  const toggleVoice = async () => {
    if (status === 'idle' || status === 'error') {
      await connectToRealtime();
    } else {
      cleanup();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Determine button text and style
  const getButtonState = () => {
    switch (status) {
      case 'connecting':
        return { text: 'CONNECTING...', disabled: true };
      case 'connected':
        return { text: 'VOICE ACTIVE', disabled: false };
      case 'error':
        return { text: 'RETRY VOICE', disabled: false };
      default:
        return { text: 'ACTIVATE VOICE', disabled: false };
    }
  };

  const buttonState = getButtonState();

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={toggleVoice}
        disabled={buttonState.disabled}
        className={`
          px-8 py-3 rounded-full transition-all duration-300 
          tracking-wider font-light flex items-center gap-3
          ${status === 'connected' 
            ? 'bg-white/10 border border-white/30 hover:bg-white/15' 
            : status === 'error'
            ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/15'
            : 'border border-white/20 hover:bg-white/5 hover:border-white/30'
          }
          ${buttonState.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Microphone Icon */}
        <div className={`w-5 h-5 relative ${isListening ? 'animate-pulse' : ''}`}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={status === 'connected' ? 'text-white' : 'text-white/60'}
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          {isListening && (
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          )}
        </div>
        
        <span>{buttonState.text}</span>
      </button>
      
      {errorMessage && (
        <div className="text-xs text-red-400/80 tracking-wider animate-fadeIn">
          {errorMessage === 'Authentication failed - check API key' 
            ? 'AUTH FAILED - CHECK API KEY' 
            : errorMessage.toUpperCase()
          }
        </div>
      )}
      
      {status === 'connected' && (
        <div className="text-xs text-white/40 tracking-wider animate-fadeIn">
          LISTENING FOR CONSCIOUSNESS SIGNALS...
        </div>
      )}
    </div>
  );
}