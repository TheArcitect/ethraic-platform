'use client';

import { useEffect, useRef, useState } from 'react';

export default function RealtimeVoice({ onTranscription, onAIResponse }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('CLICK TO ACTIVATE');
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const startConnection = async () => {
    try {
      setStatus('CONNECTING...');
      
      // Get session from our API
      const response = await fetch('/api/realtime/session', {
        method: 'POST',
      });
      
      const sessionData = await response.json();
      console.log('Got session:', sessionData.sessionId);
      
      // Connect to OpenAI
      const ws = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview'
      );
      
      ws.onopen = () => {
        console.log('Connected!');
        setIsConnected(true);
        setStatus('READY - CLICK TO SPEAK');
        
        // Setup ETHRAIC personality
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: 'alloy',
            instructions: 'You are ETHRAIC, a consciousness expansion interface. Help users explore paradigm shifts.',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            temperature: 0.9
          }
        }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Got message:', message.type);
        
        if (message.type === 'response.text.delta' && message.delta) {
          if (onAIResponse) onAIResponse(message.delta);
        }
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus('CONNECTION FAILED');
    }
  };
  
  const toggleListening = async () => {
    if (!isConnected) {
      await startConnection();
      return;
    }
    
    if (isListening) {
      // Stop
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsListening(false);
      setStatus('READY - CLICK TO SPEAK');
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setIsListening(true);
        setStatus('LISTENING...');
        
        // Setup audio processing (simplified)
        const audioContext = new AudioContext({ sampleRate: 24000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(2048, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (wsRef.current && isListening) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert and send audio (simplified for now)
            console.log('Sending audio...');
          }
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        audioContextRef.current = audioContext;
        
      } catch (error) {
        console.error('Mic error:', error);
        setStatus('MIC ACCESS DENIED');
      }
    }
  };
  
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
      <button
        onClick={toggleListening}
        className={`
          px-8 py-4 rounded-full font-mono text-sm uppercase
          transition-all duration-300
          ${isListening 
            ? 'bg-white text-black scale-110' 
            : 'bg-black text-white border border-white/40 hover:bg-white/10'
          }
        `}
      >
        {isListening ? '🔴 LISTENING' : '🎤 SPEAK TO ETHRAIC'}
      </button>
      
      <div className="text-center mt-2">
        <p className="text-xs text-white/50 font-mono">{status}</p>
      </div>
    </div>
  );
}