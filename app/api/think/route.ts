import { NextResponse } from 'next/server'
import { ETHRAICEngine } from '@/lib/ethraic-engine'

export async function POST(request: Request) {
  try {
    const { input, mode } = await request.json()
    
    const engine = new ETHRAICEngine()
    const result = await engine.process(input, mode)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Think API error:', error)
    return NextResponse.json({ 
      response: 'Please configure API keys in .env.local',
      clarity: 0,
      depth: 0 
    })
  }
}
