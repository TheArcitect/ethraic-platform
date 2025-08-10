import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Creating ephemeral token for Realtime API...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Create ephemeral token using OpenAI's session endpoint
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17', // Correct model name for Realtime API
        voice: 'alloy', // Default voice
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to create session:', errorData);
      throw new Error(`Failed to create session: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Ephemeral token created successfully');
    
    // Return the client secret that will be used for WebSocket authentication
    return NextResponse.json({
      client_secret: data.client_secret,
      session_id: data.id,
      expires_at: data.expires_at,
    });

  } catch (error: any) {
    console.error('Error creating Realtime session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Realtime session' },
      { status: 500 }
    );
  }
}