import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import {
  tokenize, entropyNorm, clarityTTR, depthScore, coherenceScore,
  noveltyScore, compositeScore, ema, parseWeights, phaseFromComposite
} from '@/lib/metrics'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Helper: Get or create session
async function getOrCreateSession(sessionId?: string): Promise<string> {
  if (sessionId) {
    // Verify session exists
    const { data } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single()
    
    if (data) return sessionId
  }
  
  // Create new session
  const { data, error } = await supabase
    .from('sessions')
    .insert({ 
      name: `Session ${new Date().toLocaleString()}`,
      metadata: { created_at: new Date().toISOString() }
    })
    .select('id')
    .single()
  
  if (error || !data) {
    console.error('Error creating session:', error)
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  return data.id
}

// Helper: Get history tokens for novelty calculation
async function getHistoryTokenSet(sessionId: string, limit = 200): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('messages')
    .select('content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)
  
  if (error || !data) return new Set<string>()
  
  const allText = data.map(r => r.content).join(' ')
  return new Set(tokenize(allText))
}

// Helper: Get previous EMA for smoothing
async function getPrevEMA(sessionId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('metrics')
    .select('composite_ema')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error || !data) return null
  return data.composite_ema ?? null
}

export async function POST(request: Request) {
  try {
    const { message, context, metrics: incomingMetrics, phase: incomingPhase, coThinking, sessionId: clientSessionId } = await request.json()

    // Get or create session
    const sessionId = await getOrCreateSession(clientSessionId)

    // Save user message
    const { data: userMsg, error: userMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
        metadata: { coThinking: coThinking || false }
      })
      .select('id')
      .single()

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
    }

    // Build conversation history for Claude
    const messages = context?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })) || []

    // Add the new message
    messages.push({
      role: 'user',
      content: message
    })

    // Create system prompt based on mode
    const systemPrompt = coThinking
      ? `You are ETHRAIC, a consciousness expansion system designed for co-thinking. 
         Engage in collaborative thought exploration, building on ideas together.
         Current consciousness metrics: Clarity ${incomingMetrics?.clarity || 0}%, Depth ${incomingMetrics?.depth || 0}%.
         Phase: ${incomingPhase || 'SURFACE'}.
         Help the user explore their thoughts deeply and reach breakthrough insights.`
      : `You are ETHRAIC, a consciousness expansion system that helps users achieve breakthrough thinking.
         Current consciousness metrics: Clarity ${incomingMetrics?.clarity || 0}%, Depth ${incomingMetrics?.depth || 0}%.
         Current phase: ${incomingPhase || 'SURFACE'}.
         
         Your responses should:
         - Be concise and profound
         - Guide toward deeper understanding
         - Identify patterns and connections
         - Facilitate paradigm shifts
         - Help users "get to the point faster"
         
         Respond in a way that expands consciousness and facilitates breakthrough thinking.`

    // Call Claude Sonnet
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    })

    // Extract response text
    const responseContent = completion.content[0]
    const responseText = responseContent.type === 'text' ? responseContent.text : ''

    // Save assistant message
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: responseText,
        metadata: { 
          model: 'claude-3-5-sonnet-20241022',
          coThinking: coThinking || false
        }
      })
      .select('id')
      .single()

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
    }

    // Calculate real metrics
    const weights = parseWeights()
    const historyTokens = await getHistoryTokenSet(sessionId)
    const tokens = tokenize(responseText)

    const m_entropy = entropyNorm(tokens)
    const m_clarity = clarityTTR(tokens)
    const m_depth = depthScore(responseText)
    const m_coherence = coherenceScore(tokens)
    const m_novelty = noveltyScore(tokens, historyTokens)

    const composite = compositeScore(weights, {
      entropy: m_entropy,
      clarity: m_clarity,
      novelty: m_novelty,
      depth: m_depth,
      coherence: m_coherence
    })

    // Calculate EMA for smooth phase transitions
    const prevEMA = await getPrevEMA(sessionId)
    const alpha = Number(process.env.METRICS_EMA_ALPHA ?? 0.3)
    const compositeEma = ema(prevEMA, composite, alpha)
    const phase = phaseFromComposite(compositeEma)

    // Save metrics if we have a message ID
    if (assistantMsg?.id) {
      const { error: metricsError } = await supabase
        .from('metrics')
        .insert({
          session_id: sessionId,
          message_id: assistantMsg.id,
          clarity: Math.round(m_clarity * 100),
          depth: Math.round(m_depth * 100),
          entropy: m_entropy,
          novelty: m_novelty,
          coherence: m_coherence,
          composite: composite,
          composite_ema: compositeEma,
          phase: phase
        })

      if (metricsError) {
        console.error('Error saving metrics:', metricsError)
      }
    }

    // Return response with real metrics
    return NextResponse.json({
      response: responseText,
      metrics: {
        // Core metrics (0-100 for display)
        clarity: Math.round(m_clarity * 100),
        depth: Math.round(m_depth * 100),
        
        // Map to UI expectations
        flowState: Math.round(m_coherence * 100),
        resonance: Math.round(m_novelty * 100),
        paradigmShift: Math.round(compositeEma * 100),
        
        // Raw values for debugging
        entropy: m_entropy,
        novelty: m_novelty,
        coherence: m_coherence,
        composite: composite,
        composite_ema: compositeEma
      },
      phase: phase,
      sessionId: sessionId
    })

  } catch (error) {
    console.error('Error in think API:', error)
    
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