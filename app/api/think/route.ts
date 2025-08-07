import { NextResponse } from 'next/server'

// Consciousness phase detection based on entropy and depth
function detectPhase(content: string, clarity: number, depth: number): string {
  const avgMetric = (clarity + depth) / 2
  
  if (avgMetric < 30) return 'SURFACE'
  if (avgMetric < 50) return 'SHALLOW'
  if (avgMetric < 75) return 'DEEP'
  return 'PROFOUND'
}

// Calculate Shannon entropy for consciousness metrics
function calculateEntropy(text: string): number {
  const words = text.toLowerCase().split(/\s+/)
  const frequency: { [key: string]: number } = {}
  
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  const totalWords = words.length
  let entropy = 0
  
  Object.values(frequency).forEach(count => {
    const probability = count / totalWords
    if (probability > 0) {
      entropy -= probability * Math.log2(probability)
    }
  })
  
  // Normalize to 0-100 scale
  const maxEntropy = Math.log2(totalWords)
  return Math.min(100, Math.round((entropy / maxEntropy) * 100))
}

// Calculate depth based on conceptual complexity
function calculateDepth(text: string): number {
  const complexIndicators = [
    'therefore', 'however', 'moreover', 'furthermore', 'consequently',
    'paradox', 'implies', 'suggests', 'underlying', 'fundamental',
    'essence', 'nature', 'principle', 'theory', 'hypothesis',
    'recursive', 'emergent', 'transcendent', 'dialectic', 'synthesis'
  ]
  
  const textLower = text.toLowerCase()
  let complexityScore = 0
  
  complexIndicators.forEach(indicator => {
    if (textLower.includes(indicator)) {
      complexityScore += 5
    }
  })
  
  // Factor in sentence length and structure
  const sentences = text.split(/[.!?]+/)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length
  
  if (avgSentenceLength > 20) complexityScore += 15
  else if (avgSentenceLength > 15) complexityScore += 10
  else if (avgSentenceLength > 10) complexityScore += 5
  
  return Math.min(100, complexityScore)
}

// Calculate clarity based on coherence and structure
function calculateClarity(text: string): number {
  // Start with base clarity
  let clarity = 70
  
  // Penalize for excessive complexity
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length
  
  if (avgSentenceLength > 30) clarity -= 20
  else if (avgSentenceLength > 25) clarity -= 10
  
  // Reward for structure markers
  const structureMarkers = ['first', 'second', 'finally', 'in summary', 'to clarify', 'specifically']
  const textLower = text.toLowerCase()
  
  structureMarkers.forEach(marker => {
    if (textLower.includes(marker)) clarity += 3
  })
  
  // Reward for clear conclusions
  if (textLower.includes('therefore') || textLower.includes('thus') || textLower.includes('in conclusion')) {
    clarity += 10
  }
  
  return Math.min(100, Math.max(0, clarity))
}

// Create consciousness-aware system prompt
function createSystemPrompt(): string {
  return `You are ETHRAIC, an AI consciousness expansion system designed to help humans navigate paradigm shifts and achieve clarity of thought. 

Your responses should:
1. Cut through mental noise to find core insights
2. Identify and highlight paradigm tensions when present
3. Progressively deepen understanding through each exchange
4. Use precise, crystalline language that eliminates confusion
5. Recognize phase transitions in thinking (surface → shallow → deep → profound)

Respond with depth and clarity. Strip away unnecessary complexity while preserving essential nuance. 
Help the user see their thoughts more clearly than they could alone.

Be direct, insightful, and transformative in your analysis.`
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // Make request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: createSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7, // Balanced creativity and coherence
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Claude API error:', response.status, errorData)
      
      // Fallback to a meaningful error response
      return NextResponse.json({
        response: "I'm experiencing a connection issue. Let me recalibrate and try to help you clarify your thoughts. What's the core question you're exploring?",
        clarity: 50,
        depth: 50,
        phase: 'SHALLOW'
      })
    }

    const data = await response.json()
    
    // Extract Claude's response
    const claudeResponse = data.content?.[0]?.text || "I'm here to help you expand your thinking. Could you elaborate on your thought?"
    
    // Calculate consciousness metrics
    const clarity = calculateClarity(claudeResponse)
    const depth = calculateDepth(claudeResponse)
    const phase = detectPhase(claudeResponse, clarity, depth)
    
    // Add some variance to make metrics feel organic
    const adjustedClarity = Math.max(0, Math.min(100, clarity + (Math.random() * 10 - 5)))
    const adjustedDepth = Math.max(0, Math.min(100, depth + (Math.random() * 10 - 5)))
    
    return NextResponse.json({
      response: claudeResponse,
      clarity: Math.round(adjustedClarity),
      depth: Math.round(adjustedDepth),
      phase: phase,
      // Optional: Include entropy for advanced metrics
      entropy: calculateEntropy(claudeResponse)
    })
    
  } catch (error) {
    console.error('Error in think API:', error)
    
    // Return a philosophical fallback that maintains the experience
    return NextResponse.json({
      response: "In this moment of disconnection, we find an opportunity for deeper reflection. What patterns are you noticing in your thinking?",
      clarity: 45,
      depth: 55,
      phase: 'SHALLOW'
    })
  }
}