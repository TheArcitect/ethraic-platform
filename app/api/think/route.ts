import { NextResponse } from 'next/server'
import { ConsciousnessEngine } from '@/lib/ethraic-engine'

export async function POST(request: Request) {
  try {
    const { input, mode } = await request.json()

    const engine = new ConsciousnessEngine()
    const result = await engine.generateResponse(input, mode)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Think API error:', error)
    return NextResponse.json(
      {
        response: 'Please configure API keys in .env.local',
        clarity: 0,
        depth: 0,
        phase: 'SURFACE',
        metrics: {
          entropy: 0,
          uncertainty: 0,
          paradox: 0,
          depth: 0,
          breakthrough: 0,
        },
      },
      { status: 500 },
    )
  }

// ensure final newline
}
