// lib/paradigm-detector.ts
// ETHRAIC Paradigm Detection System
// Identifies breakthrough moments and paradigm shifts in real-time

export interface ParadigmPattern {
  type: 'convergence' | 'divergence' | 'emergence' | 'transcendence' | 'integration'
  strength: number
  confidence: number
  description: string
  timestamp: number
}

export interface ThoughtPattern {
  id: string
  content: string
  vector: number[]
  timestamp: number
  role: 'user' | 'assistant'
}

export interface BreakthroughIndicator {
  type: string
  signal: number
  description: string
}

export class ParadigmDetector {
  private thoughtPatterns: ThoughtPattern[] = []
  private breakthroughHistory: ParadigmPattern[] = []
  private patternThreshold = 0.7
  private readonly maxPatterns = 100

  // Linguistic markers for different types of breakthroughs
  private readonly markers = {
    convergence: [
      'everything connects', 'it all makes sense', 'coming together',
      'unified', 'whole picture', 'integration', 'synthesis'
    ],
    divergence: [
      'completely different', 'new perspective', 'never thought',
      'alternative', 'opposite', 'flip', 'reverse'
    ],
    emergence: [
      'suddenly', 'just realized', 'aha', 'eureka', 'breakthrough',
      'dawned on me', 'lightbulb', 'click'
    ],
    transcendence: [
      'beyond', 'transcend', 'higher level', 'meta', 'above',
      'zoom out', 'bigger picture', 'fundamental'
    ],
    integration: [
      'both/and', 'paradox resolved', 'holding both', 'inclusive',
      'reconcile', 'bridge', 'synthesize'
    ]
  }

  // Conceptual distance markers
  private readonly distanceIndicators = {
    far: ['completely unrelated', 'different domain', 'never connected'],
    medium: ['reminds me of', 'similar to', 'like'],
    near: ['directly related', 'obviously connected', 'same as']
  }

  // Convert text to vector representation (simplified)
  private textToVector(text: string): number[] {
    const vector: number[] = new Array(128).fill(0)
    const words = text.toLowerCase().split(/\s+/)
    
    // Simple bag-of-words with positional encoding
    words.forEach((word, index) => {
      const hash = this.hashCode(word)
      const position = Math.abs(hash) % vector.length
      vector[position] += 1 / (index + 1) // Positional weighting
    })
    
    // Add semantic features
    Object.entries(this.markers).forEach(([type, markerWords], typeIndex) => {
      markerWords.forEach(marker => {
        if (text.toLowerCase().includes(marker)) {
          vector[120 + typeIndex] += 1
        }
      })
    })
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector
  }

  // Simple hash function for word to number conversion
  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash
  }

  // Calculate cosine similarity between vectors
  private cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0
    
    let dotProduct = 0
    let magnitude1 = 0
    let magnitude2 = 0
    
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i]
      magnitude1 += v1[i] * v1[i]
      magnitude2 += v2[i] * v2[i]
    }
    
    magnitude1 = Math.sqrt(magnitude1)
    magnitude2 = Math.sqrt(magnitude2)
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0
    return dotProduct / (magnitude1 * magnitude2)
  }

  // Detect paradigm patterns in thought sequence
  detectPattern(newThought: string, role: 'user' | 'assistant'): ParadigmPattern | null {
    const vector = this.textToVector(newThought)
    const pattern: ThoughtPattern = {
      id: `thought_${Date.now()}`,
      content: newThought,
      vector,
      timestamp: Date.now(),
      role
    }
    
    this.thoughtPatterns.push(pattern)
    
    // Keep pattern history bounded
    if (this.thoughtPatterns.length > this.maxPatterns) {
      this.thoughtPatterns = this.thoughtPatterns.slice(-this.maxPatterns)
    }
    
    // Analyze for breakthrough patterns
    const paradigmPattern = this.analyzeForBreakthrough(pattern)
    
    if (paradigmPattern && paradigmPattern.strength > this.patternThreshold) {
      this.breakthroughHistory.push(paradigmPattern)
      return paradigmPattern
    }
    
    return null
  }

  // Analyze thought patterns for breakthrough indicators
  private analyzeForBreakthrough(currentPattern: ThoughtPattern): ParadigmPattern | null {
    if (this.thoughtPatterns.length < 3) return null
    
    const recentPatterns = this.thoughtPatterns.slice(-10)
    const text = currentPattern.content.toLowerCase()
    
    // Check for explicit breakthrough markers
    let maxSignal = 0
    let detectedType: keyof typeof this.markers | null = null
    
    Object.entries(this.markers).forEach(([type, markers]) => {
      const signal = markers.reduce((count, marker) => 
        count + (text.includes(marker) ? 1 : 0), 0
      ) / markers.length
      
      if (signal > maxSignal) {
        maxSignal = signal
        detectedType = type as keyof typeof this.markers
      }
    })
    
    // Analyze pattern evolution
    const evolutionScore = this.analyzePatternEvolution(recentPatterns)
    
    // Detect conceptual leaps
    const leapScore = this.detectConceptualLeap(currentPattern, recentPatterns)
    
    // Calculate emergence score
    const emergenceScore = this.calculateEmergenceScore(currentPattern, recentPatterns)
    
    // Combine scores
    const totalStrength = (maxSignal * 0.3 + evolutionScore * 0.3 + 
                          leapScore * 0.2 + emergenceScore * 0.2)
    
    if (totalStrength > 0.3) {
      return {
        type: detectedType || this.inferPatternType(evolutionScore, leapScore, emergenceScore),
        strength: Math.min(1, totalStrength),
        confidence: this.calculateConfidence(recentPatterns),
        description: this.generatePatternDescription(detectedType, totalStrength),
        timestamp: Date.now()
      }
    }
    
    return null
  }

  // Analyze how patterns evolve over time
  private analyzePatternEvolution(patterns: ThoughtPattern[]): number {
    if (patterns.length < 2) return 0
    
    let evolutionScore = 0
    
    // Check for increasing complexity
    const complexities = patterns.map(p => p.content.length)
    const complexityTrend = this.calculateTrend(complexities)
    
    // Check for semantic drift
    let totalDrift = 0
    for (let i = 1; i < patterns.length; i++) {
      const similarity = this.cosineSimilarity(patterns[i-1].vector, patterns[i].vector)
      totalDrift += (1 - similarity)
    }
    const avgDrift = totalDrift / (patterns.length - 1)
    
    // Optimal evolution: moderate drift with increasing complexity
    evolutionScore = (complexityTrend * 0.5 + avgDrift * 0.5)
    
    return Math.min(1, evolutionScore)
  }

  // Detect conceptual leaps between thoughts
  private detectConceptualLeap(current: ThoughtPattern, recent: ThoughtPattern[]): number {
    if (recent.length < 2) return 0
    
    // Compare current thought with recent average
    const recentVectors = recent.slice(-5).map(p => p.vector)
    const avgVector = this.averageVectors(recentVectors)
    const distance = 1 - this.cosineSimilarity(current.vector, avgVector)
    
    // High distance with semantic coherence indicates conceptual leap
    const coherence = this.checkSemanticCoherence(current.content, recent.map(p => p.content))
    
    return distance * coherence
  }

  // Calculate emergence score
  private calculateEmergenceScore(current: ThoughtPattern, recent: ThoughtPattern[]): number {
    // Check for novel concepts not present in recent patterns
    const currentWords = new Set(current.content.toLowerCase().split(/\s+/))
    const recentWords = new Set(
      recent.flatMap(p => p.content.toLowerCase().split(/\s+/))
    )
    
    let novelWords = 0
    currentWords.forEach(word => {
      if (!recentWords.has(word) && word.length > 4) {
        novelWords++
      }
    })
    
    const noveltyRatio = novelWords / currentWords.size
    
    // Check for emergence markers
    const emergenceMarkers = ['emerge', 'arise', 'develop', 'form', 'crystallize']
    const hasEmergenceMarker = emergenceMarkers.some(marker => 
      current.content.toLowerCase().includes(marker)
    )
    
    return Math.min(1, noveltyRatio + (hasEmergenceMarker ? 0.3 : 0))
  }

  // Infer pattern type from scores
  private inferPatternType(evolution: number, leap: number, emergence: number): ParadigmPattern['type'] {
    const scores = {
      convergence: evolution * 0.5 + (1 - leap) * 0.5,
      divergence: leap * 0.7 + evolution * 0.3,
      emergence: emergence * 0.8 + evolution * 0.2,
      transcendence: leap * 0.5 + emergence * 0.5,
      integration: evolution * 0.4 + emergence * 0.3 + (1 - leap) * 0.3
    }
    
    let maxType: ParadigmPattern['type'] = 'emergence'
    let maxScore = 0
    
    Object.entries(scores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxScore = score
        maxType = type as ParadigmPattern['type']
      }
    })
    
    return maxType
  }

  // Calculate confidence in pattern detection
  private calculateConfidence(patterns: ThoughtPattern[]): number {
    // More patterns = higher confidence
    const patternCount = Math.min(patterns.length / 10, 1)
    
    // Consistency in pattern evolution
    const vectors = patterns.map(p => p.vector)
    let consistency = 0
    for (let i = 1; i < vectors.length; i++) {
      consistency += this.cosineSimilarity(vectors[i-1], vectors[i])
    }
    consistency = consistency / (vectors.length - 1)
    
    return (patternCount * 0.5 + consistency * 0.5)
  }

  // Generate human-readable pattern description
  private generatePatternDescription(type: string | null, strength: number): string {
    const intensity = strength > 0.8 ? 'Strong' : strength > 0.5 ? 'Moderate' : 'Emerging'
    
    const descriptions: Record<string, string> = {
      convergence: `${intensity} convergence detected - multiple thought threads unifying into coherent understanding`,
      divergence: `${intensity} divergence observed - exploring radically new conceptual territory`,
      emergence: `${intensity} emergence pattern - new insights crystallizing from thought interactions`,
      transcendence: `${intensity} transcendence indicated - rising above previous conceptual limitations`,
      integration: `${intensity} integration occurring - synthesizing disparate elements into unified whole`
    }
    
    return descriptions[type || 'emergence'] || `${intensity} paradigm shift pattern detected`
  }

  // Helper functions
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0
    
    let trend = 0
    for (let i = 1; i < values.length; i++) {
      trend += (values[i] - values[i-1]) / values[i-1]
    }
    
    return trend / (values.length - 1)
  }

  private averageVectors(vectors: number[][]): number[] {
    if (vectors.length === 0) return []
    
    const avg = new Array(vectors[0].length).fill(0)
    vectors.forEach(v => {
      v.forEach((val, i) => {
        avg[i] += val
      })
    })
    
    return avg.map(val => val / vectors.length)
  }

  private checkSemanticCoherence(current: string, recent: string[]): number {
    // Simple coherence check - shared vocabulary
    const currentWords = new Set(current.toLowerCase().split(/\s+/))
    const recentWords = new Set(recent.join(' ').toLowerCase().split(/\s+/))
    
    let sharedWords = 0
    currentWords.forEach(word => {
      if (recentWords.has(word) && word.length > 3) {
        sharedWords++
      }
    })
    
    return Math.min(1, sharedWords / Math.max(currentWords.size, 1))
  }

  // Get breakthrough indicators
  getBreakthroughIndicators(): BreakthroughIndicator[] {
    const indicators: BreakthroughIndicator[] = []
    
    if (this.thoughtPatterns.length < 3) {
      return [{
        type: 'warming_up',
        signal: 0.2,
        description: 'Building thought momentum'
      }]
    }
    
    // Analyze recent patterns
    const recent = this.thoughtPatterns.slice(-10)
    const evolution = this.analyzePatternEvolution(recent)
    
    if (evolution > 0.7) {
      indicators.push({
        type: 'evolution',
        signal: evolution,
        description: 'Thought patterns evolving rapidly'
      })
    }
    
    // Check for acceleration
    const timestamps = recent.map(p => p.timestamp)
    const intervals = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1])
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const recentInterval = intervals[intervals.length - 1]
    
    if (recentInterval < avgInterval * 0.7) {
      indicators.push({
        type: 'acceleration',
        signal: 0.8,
        description: 'Thought velocity increasing'
      })
    }
    
    // Check breakthrough history
    const recentBreakthroughs = this.breakthroughHistory.filter(
      b => Date.now() - b.timestamp < 300000 // Last 5 minutes
    )
    
    if (recentBreakthroughs.length > 0) {
      indicators.push({
        type: 'momentum',
        signal: Math.min(1, recentBreakthroughs.length * 0.3),
        description: `${recentBreakthroughs.length} recent breakthrough${recentBreakthroughs.length > 1 ? 's' : ''}`
      })
    }
    
    return indicators
  }

  // Get pattern history
  getPatternHistory(): ParadigmPattern[] {
    return [...this.breakthroughHistory]
  }

  // Reset detector
  reset(): void {
    this.thoughtPatterns = []
    this.breakthroughHistory = []
  }
}