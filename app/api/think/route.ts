import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { message, context, metrics, phase, coThinking } = await request.json()

    // Build the conversation history
    const messages = context.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Add the new message
    messages.push({
      role: 'user',
      content: message
    })

    // Create system prompt based on mode
    const systemPrompt = coThinking
      ? `You are ETHRAIC, a consciousness expansion system designed for co-thinking. 
         Engage in collaborative thought exploration, building on ideas together.
         Current consciousness metrics: Clarity ${metrics?.clarity || 0}%, Depth ${metrics?.depth || 0}%.
         Phase: ${phase || 'SURFACE'}.
         Help the user explore their thoughts deeply and reach breakthrough insights.`
      : `You are ETHRAIC, a consciousness expansion system that helps users achieve breakthrough thinking.
         Current consciousness metrics: Clarity ${metrics?.clarity || 0}%, Depth ${metrics?.depth || 0}%.
         Current phase: ${phase || 'SURFACE'}.
         
         Your responses should:
         - Be concise and profound
         - Guide toward deeper understanding
         - Identify patterns and connections
         - Facilitate paradigm shifts
         - Help users "get to the point faster"
         
         Respond in a way that expands consciousness and facilitates breakthrough thinking.`

    // Call Claude Sonnet (using the correct model name)
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Updated to latest Sonnet model
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    })

    // Extract the response text
    const responseContent = completion.content[0]
    const responseText = responseContent.type === 'text' ? responseContent.text : ''

    return NextResponse.json({
      response: responseText,
      metrics: metrics,
      phase: phase
    })

  } catch (error) {
    console.error('Error in think API:', error)
    
    // More detailed error logging
    if (error instanceof Anthropic.APIError) {
      console.error('Anthropic API Error:', {
        status: error.status,
        message: error.message,
        type: error.type
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process thought',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}