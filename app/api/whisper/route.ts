import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000,
});

export async function POST(req: NextRequest) {
  console.log('Whisper API called');
  
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.log('No audio file provided');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Audio file size:', audioFile.size, 'bytes');
    console.log('Audio file type:', audioFile.type);

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    const file = new File([audioBlob], 'audio.webm', {
      type: 'audio/webm',
    });

    console.log('Sending to Whisper API...');
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    console.log('Transcription successful:', transcription.text);

    return NextResponse.json({
      text: transcription.text,
      metrics: {
        wordCount: transcription.text.split(' ').length,
        isQuestion: transcription.text.includes('?'),
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error: any) {
    console.error('Whisper API error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
    });
    
    if (error.code === 'ECONNRESET') {
      return NextResponse.json({
        text: "I couldn't transcribe your audio due to a connection issue. Please try speaking again or typing your thought.",
        error: 'Connection reset - please try again',
      }, { status: 503 });
    }
    
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};
