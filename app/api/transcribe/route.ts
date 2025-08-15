// app/api/transcribe/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Convert File to format OpenAI expects
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      prompt: 'Consciousness expansion, paradigm shifts, breakthrough thinking, deep insights',
    })

    return NextResponse.json({
      text: response.text,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Transcription error:', error)
    
    // Fallback message suggesting Web Speech API
    return NextResponse.json(
      { 
        error: 'Whisper transcription failed. Using browser speech recognition as fallback.',
        fallback: true
      },
      { status: 500 }
    )
  }
}

// Alternative implementation using Web Speech API (client-side)
// This would be handled in the component using the browser's built-in speech recognition