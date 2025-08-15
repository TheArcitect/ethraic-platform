import { ElevenLabsClient } from "elevenlabs";
import { NextResponse } from "next/server";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    const audioStream = await elevenlabs.generate({
      voice: "Rachel",
      text: text,
      model_id: "eleven_monolingual_v1"
    });

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('ElevenLabs error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}