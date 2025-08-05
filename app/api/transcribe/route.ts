import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 })
    }

    // Check file size (Whisper limit is 25MB, 4 minutes of audio should be ~3-5MB)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'Audio file too large. Try a shorter recording.' 
      }, { status: 400 })
    }

    console.log(`Transcribing audio: ${audioFile.size} bytes`)

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'text',
        language: 'en' // Specify English for better accuracy
      })

      return NextResponse.json({ 
        text: transcription,
        timestamp: new Date().toISOString()
      })
    } catch (whisperError: any) {
      console.error('Whisper API error:', whisperError)
      return NextResponse.json({ 
        error: 'Transcription failed', 
        details: whisperError.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Transcribe route error:', error)
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 })
  }
}
