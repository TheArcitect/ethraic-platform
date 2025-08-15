import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import {
  tokenize, entropyNorm,clarityTTR, depthScore, coherenceScore,
  noveltyScore, compositeScore, ema, parseWeights, phaseFromComposite
} from '@/lib/metrics'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

async function getOrCreateSession(sessionId?: string) {
  if (sessionId) return sessionId
  const { data, error } = await supabase.from('sessions').insert({}).select('id').single()
  if (error) throw error
  return data!.id as string
}

async function getHistoryTokenSet(sessionId: string, limit = 200) {
  const { data, error } = await supabase
    .from('messages')
    .select('content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error || !data) return new Set<string>()
  const all = data.map((r: any) => r.content).join(' ')
  return new Set(tokenize(all))
}

async function getPrevEMA(sessionId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('metrics')
    .select('composite_ema')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return (data as any).composite_ema ?? null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, context, metrics, phase, coThinking, sessionId } = body

    // Build the conversation history from prior context
    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    if (Array.isArray(context)) {
      for (const msg of context) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      }
    }
    // Append the current user message
    messages.push({ role: 'user', content: message })

    // Compose system prompt
    const systemPrompt = coThinking
      ? `You are ETHRAIC, a consciousness expansion system that collaborates in co-thinking mode to explore thoughts. Phase: ${phase || 'SURFACE'}.`
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

    // Call Claude Sonnet
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    })

    const responseText = (completion as any).content?.[0]?.text ?? ''

    // Get or create session id
    const sid = await getOrCreateSession(sessionId)

    // Insert user message
    await supabase.from('messages').insert({
      session_id: sid,
      role: 'user',
      content: message
    })

    // Insert assistant message and capture id
    const { data: msgRow, error: msgErr } = await supabase
      .from('messages')
      .insert({
        session_id: sid,
        role: 'assistant',
        content: responseText
      })
      .select('id')
      .single()
    if (msgErr) throw msgErr

    // Compute metrics
    const weights = parseWeights()
    const hist = await getHistoryTokenSet(sid)
    const toks = tokenize(responseText)
    const m_entropy = entropyNorm(toks)
    const m_clarity = clarityTTR(toks)
    const m_depth = depthScore(responseText)
    const m_cohere = coherenceScore(toks)
    const m_novel = noveltyScore(toks, hist)
    const composite = compositeScore(weights, {
      entropy: m_entropy,
      clarity: m_clarity,
      novelty: m_novel,
      depth: m_depth,
      coherence: m_cohere
    })
    const prev = await getPrevEMA(sid)
    const compositeEma = ema(prev, composite, 0.3)
    const phaseName = phaseFromComposite(compositeEma)

    // Persist metrics
    await supabase.from('metrics').insert({
      session_id: sid,
      message_id: msgRow.id,
      clarity: Math.round(m_clarity * 100),
      depth: Math.round(m_depth * 100),
      entropy: m_entropy,
      novelty: m_novel,
      coherence: m_cohere,
      composite: composite,
      composite_ema: compositeEma,
      phase: phaseName
    })

    return NextResponse.json({
      response: responseText,
      metrics: {
        clarity: Math.round(m_clarity * 100),
        depth: Math.round(m_depth * 100),
        entropy: m_entropy,
        novelty: m_novel,
        coherence: m_cohere,
        composite: composite,
        composite_ema: compositeEma,
        flowState: Math.round(m_cohere * 100),
        resonance: Math.round(m_novel * 100),
        paradigmShift: Math.round(compositeEma * 100)
      },
      phase: phaseName,
      sessionId: sid
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 })
  }
}
