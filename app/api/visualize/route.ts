import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const systemPrompt = `You are the Visual Consciousness Interface for ETHRAIC. Generate dynamic UI adaptations based on consciousness analysis data. Respond only with executable JSON code for immediate implementation.`

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    const body = await request.json()

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate visual adaptation for: ${JSON.stringify(body)}`
      }
    ]

    const model = process.env.GPT4_MODEL || 'gpt-4-turbo'
    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 500,
    })

    const content = completion.choices?.[0]?.message?.content?.trim() || ''
    let visualAdaptation: any
    try {
      visualAdaptation = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON from GPT-4', raw: content }, { status: 500 })
    }

    return NextResponse.json(visualAdaptation)
  } catch (error: any) {
    console.error('Visualize API error:', error)
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 })
  }
}
