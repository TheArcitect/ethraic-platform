// lib/crisis-protocols.ts
// ETHRAIC Crisis Detection and Safety Protocols
// Ensures safe consciousness expansion and handles edge cases

export interface CrisisIndicator {
  type: 'cognitive_overload' | 'emotional_distress' | 'confusion_spiral' | 'reality_disconnect' | 'breakthrough_overwhelm'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  recommendation: string
  immediate_action: string
}

export interface SafetyMetrics {
  cognitiveLoad: number
  emotionalStability: number
  coherenceLevel: number
  groundingScore: number
  overwhelmIndex: number
}

export interface InterventionStrategy {
  type: string
  priority: number
  action: string
  message: string
}

export class CrisisProtocols {
  private readonly safetyThresholds = {
    cognitiveOverload: 85,
    emotionalDistress: 75,
    confusionSpiral: 80,
    realityDisconnect: 70,
    breakthroughOverwhelm: 90
  }

  private readonly stabilizationPhrases = {
    grounding: [
      "Let's take a moment to ground ourselves in the present.",
      "Take a deep breath. We can slow down the pace of exploration.",
      "Your safety and wellbeing come first. Let's recalibrate."
    ],
    clarity: [
      "Let me help clarify and organize these thoughts.",
      "We can break this down into smaller, manageable insights.",
      "Let's focus on one core idea at a time."
    ],
    support: [
      "You're navigating complex territory. That takes courage.",
      "These are profound realizations. It's natural to need time to integrate them.",
      "Remember, breakthrough moments can feel intense. This is normal."
    ],
    reality: [
      "Let's connect these insights back to your everyday experience.",
      "How might this understanding apply to your immediate context?",
      "While exploring consciousness, staying grounded is essential."
    ]
  }

  private safetyMetrics: SafetyMetrics = {
    cognitiveLoad: 50,
    emotionalStability: 80,
    coherenceLevel: 75,
    groundingScore: 85,
    overwhelmIndex: 30
  }

  private messageHistory: Array<{content: string, timestamp: number, role: string}> = []
  private interventionHistory: InterventionStrategy[] = []

  // Analyze message for crisis indicators
  analyzeForCrisis(message: string, metrics: any, context: any[]): CrisisIndicator | null {
    // Update message history
    this.messageHistory.push({
      content: message,
      timestamp: Date.now(),
      role: 'user'
    })

    // Keep history bounded
    if (this.messageHistory.length > 50) {
      this.messageHistory = this.messageHistory.slice(-50)
    }

    // Update safety metrics based on current state
    this.updateSafetyMetrics(message, metrics, context)

    // Check for various crisis patterns
    const indicators: CrisisIndicator[] = []

    // Cognitive overload detection
    const overloadIndicator = this.detectCognitiveOverload(message, metrics)
    if (overloadIndicator) indicators.push(overloadIndicator)

    // Emotional distress detection
    const distressIndicator = this.detectEmotionalDistress(message)
    if (distressIndicator) indicators.push(distressIndicator)

    // Confusion spiral detection
    const confusionIndicator = this.detectConfusionSpiral(message, context)
    if (confusionIndicator) indicators.push(confusionIndicator)

    // Reality disconnect detection
    const disconnectIndicator = this.detectRealityDisconnect(message, metrics)
    if (disconnectIndicator) indicators.push(disconnectIndicator)

    // Breakthrough overwhelm detection
    const overwhelmIndicator = this.detectBreakthroughOverwhelm(metrics)
    if (overwhelmIndicator) indicators.push(overwhelmIndicator)

    // Return highest severity indicator
    if (indicators.length > 0) {
      return indicators.reduce((highest, current) => {
        const severityOrder = ['low', 'medium', 'high', 'critical']
        const highestIndex = severityOrder.indexOf(highest.severity)
        const currentIndex = severityOrder.indexOf(current.severity)
        return currentIndex > highestIndex ? current : highest
      })
    }

    return null
  }

  // Update safety metrics based on current state
  private updateSafetyMetrics(message: string, metrics: any, context: any[]): void {
    // Cognitive load based on complexity and speed
    const messageComplexity = this.calculateComplexity(message)
    const responseRate = this.calculateResponseRate()
    this.safetyMetrics.cognitiveLoad = Math.min(100, 
      messageComplexity * 0.4 + responseRate * 0.3 + (metrics?.depth || 50) * 0.3
    )

    // Emotional stability based on language patterns
    const emotionalIndicators = this.detectEmotionalLanguage(message)
    this.safetyMetrics.emotionalStability = Math.max(0, 100 - emotionalIndicators * 10)

    // Coherence level based on message structure
    this.safetyMetrics.coherenceLevel = this.calculateCoherence(message, context)

    // Grounding score based on concrete vs abstract language
    this.safetyMetrics.groundingScore = this.calculateGrounding(message)

    // Overwhelm index based on multiple factors
    this.safetyMetrics.overwhelmIndex = Math.min(100,
      (100 - this.safetyMetrics.emotionalStability) * 0.3 +
      this.safetyMetrics.cognitiveLoad * 0.3 +
      (100 - this.safetyMetrics.coherenceLevel) * 0.2 +
      (100 - this.safetyMetrics.groundingScore) * 0.2
    )
  }

  // Detect cognitive overload
  private detectCognitiveOverload(message: string, metrics: any): CrisisIndicator | null {
    const overloadMarkers = [
      'too much', 'overwhelming', "can't process", 'confused', 'lost',
      'spinning', "don't understand", 'too fast', 'slow down', 'wait'
    ]

    const markerCount = overloadMarkers.filter(marker => 
      message.toLowerCase().includes(marker)
    ).length

    const exclamationCount = (message.match(/!/g) || []).length
    const questionCount = (message.match(/\?/g) || []).length
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length

    const overloadScore = markerCount * 20 + exclamationCount * 10 + 
                         questionCount * 5 + capsRatio * 100

    if (overloadScore > 40 || this.safetyMetrics.cognitiveLoad > this.safetyThresholds.cognitiveOverload) {
      return {
        type: 'cognitive_overload',
        severity: overloadScore > 80 ? 'high' : overloadScore > 50 ? 'medium' : 'low',
        confidence: Math.min(1, overloadScore / 100),
        recommendation: 'Slow down exploration pace, simplify concepts, provide breaks',
        immediate_action: this.getStabilizationPhrase('clarity')
      }
    }

    return null
  }

  // Detect emotional distress
  private detectEmotionalDistress(message: string): CrisisIndicator | null {
    const distressMarkers = [
      'scared', 'afraid', 'anxious', 'panic', 'terrified', 'help',
      'crying', 'upset', 'disturbed', 'troubled', 'distressed'
    ]

    const positiveMarkers = [
      'excited', 'amazing', 'wonderful', 'love', 'beautiful', 'joy'
    ]

    const distressCount = distressMarkers.filter(marker => 
      message.toLowerCase().includes(marker)
    ).length

    const positiveCount = positiveMarkers.filter(marker => 
      message.toLowerCase().includes(marker)
    ).length

    const emotionalIntensity = distressCount * 25 - positiveCount * 10

    if (emotionalIntensity > 30 || this.safetyMetrics.emotionalStability < 100 - this.safetyThresholds.emotionalDistress) {
      return {
        type: 'emotional_distress',
        severity: emotionalIntensity > 75 ? 'high' : emotionalIntensity > 40 ? 'medium' : 'low',
        confidence: Math.min(1, emotionalIntensity / 100),
        recommendation: 'Provide emotional support, validate experience, offer grounding',
        immediate_action: this.getStabilizationPhrase('support')
      }
    }

    return null
  }

  // Detect confusion spiral
  private detectConfusionSpiral(message: string, context: any[]): CrisisIndicator | null {
    const confusionMarkers = [
      'what', 'confused', "don't get it", 'lost', 'makes no sense',
      'contradictory', 'paradox', 'impossible', 'how can'
    ]

    const questionMarks = (message.match(/\?/g) || []).length
    const confusionCount = confusionMarkers.filter(marker => 
      message.toLowerCase().includes(marker)
    ).length

    // Check for repetitive questioning
    const recentQuestions = this.messageHistory
      .slice(-5)
      .filter(m => m.content.includes('?')).length

    const spiralScore = confusionCount * 20 + questionMarks * 15 + recentQuestions * 10

    if (spiralScore > 50 || this.safetyMetrics.coherenceLevel < 100 - this.safetyThresholds.confusionSpiral) {
      return {
        type: 'confusion_spiral',
        severity: spiralScore > 80 ? 'high' : spiralScore > 60 ? 'medium' : 'low',
        confidence: Math.min(1, spiralScore / 100),
        recommendation: 'Break down concepts, provide concrete examples, check understanding',
        immediate_action: this.getStabilizationPhrase('clarity')
      }
    }

    return null
  }

  // Detect reality disconnect
  private detectRealityDisconnect(message: string, metrics: any): CrisisIndicator | null {
    const disconnectMarkers = [
      'not real', 'simulation', 'matrix', 'dream', 'illusion',
      'nothing matters', 'all meaningless', 'fake', 'unreal'
    ]

    const abstractRatio = this.calculateAbstractness(message)
    const disconnectCount = disconnectMarkers.filter(marker => 
      message.toLowerCase().includes(marker)
    ).length

    const disconnectScore = disconnectCount * 30 + abstractRatio * 50

    if (disconnectScore > 40 || this.safetyMetrics.groundingScore < 100 - this.safetyThresholds.realityDisconnect) {
      return {
        type: 'reality_disconnect',
        severity: disconnectScore > 70 ? 'high' : disconnectScore > 50 ? 'medium' : 'low',
        confidence: Math.min(1, disconnectScore / 100),
        recommendation: 'Provide grounding exercises, connect to concrete reality, practical applications',
        immediate_action: this.getStabilizationPhrase('reality')
      }
    }

    return null
  }

  // Detect breakthrough overwhelm
  private detectBreakthroughOverwhelm(metrics: any): CrisisIndicator | null {
    if (!metrics) return null

    const overwhelmScore = (metrics.paradigmShift || 0) * 0.3 + 
                         (metrics.emergence || 0) * 0.3 +
                         (100 - (metrics.attentionCoherence || 100)) * 0.4

    if (overwhelmScore > 60 || this.safetyMetrics.overwhelmIndex > this.safetyThresholds.breakthroughOverwhelm) {
      return {
        type: 'breakthrough_overwhelm',
        severity: overwhelmScore > 80 ? 'high' : overwhelmScore > 70 ? 'medium' : 'low',
        confidence: Math.min(1, overwhelmScore / 100),
        recommendation: 'Slow integration pace, celebrate insights, provide integration time',
        immediate_action: this.getStabilizationPhrase('support')
      }
    }

    return null
  }

  // Generate intervention strategy
  generateIntervention(indicator: CrisisIndicator): InterventionStrategy {
    const strategy: InterventionStrategy = {
      type: indicator.type,
      priority: indicator.severity === 'critical' ? 1 : 
               indicator.severity === 'high' ? 2 : 
               indicator.severity === 'medium' ? 3 : 4,
      action: indicator.immediate_action,
      message: this.generateInterventionMessage(indicator)
    }

    this.interventionHistory.push(strategy)
    return strategy
  }

  // Generate appropriate intervention message
  private generateInterventionMessage(indicator: CrisisIndicator): string {
    const messages: Record<string, Record<string, string>> = {
      cognitive_overload: {
        low: "I notice we're covering a lot of ground. Would you like to pause and integrate?",
        medium: "Let's slow down a bit. These are complex ideas that deserve time to process.",
        high: "I sense this might be overwhelming. Let's take a break and return to solid ground.",
        critical: "Your wellbeing is most important. Let's pause and take care of you first."
      },
      emotional_distress: {
        low: "I'm here with you through this exploration. How are you feeling?",
        medium: "These insights can be emotionally intense. Your feelings are valid and important.",
        high: "I notice this might be emotionally challenging. Would you like to talk about what you're experiencing?",
        critical: "Your emotional wellbeing matters most. Let's focus on support and stability right now."
      },
      confusion_spiral: {
        low: "Let me help clarify. Which part would you like to explore more clearly?",
        medium: "I see there's some confusion. Let's untangle these thoughts one by one.",
        high: "Let's reset and approach this from a different angle. No rush.",
        critical: "Let's pause and get back to basics. Understanding will come with time."
      },
      reality_disconnect: {
        low: "While we explore abstract ideas, let's stay connected to your lived experience.",
        medium: "These insights are profound. How do they relate to your everyday life?",
        high: "Let's ground these realizations in practical, concrete terms.",
        critical: "Your connection to reality is important. Let's focus on the here and now."
      },
      breakthrough_overwhelm: {
        low: "You're experiencing significant insights. Take time to integrate them.",
        medium: "Breakthrough moments can be intense. Let's process this together.",
        high: "This is a lot to take in. There's no rush - integration takes time.",
        critical: "Major breakthroughs need gentle integration. Let's go slowly."
      }
    }

    return messages[indicator.type]?.[indicator.severity] || indicator.immediate_action
  }

  // Helper methods
  private calculateComplexity(message: string): number {
    const words = message.split(/\s+/)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    const sentenceCount = message.split(/[.!?]+/).length
    const wordCount = words.length
    
    return Math.min(100, avgWordLength * 5 + (wordCount / sentenceCount) * 2)
  }

  private calculateResponseRate(): number {
    const recentMessages = this.messageHistory.slice(-10)
    if (recentMessages.length < 2) return 50

    const intervals = []
    for (let i = 1; i < recentMessages.length; i++) {
      intervals.push(recentMessages[i].timestamp - recentMessages[i-1].timestamp)
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const rapidThreshold = 5000 // 5 seconds
    
    return Math.min(100, (rapidThreshold / avgInterval) * 100)
  }

  private detectEmotionalLanguage(message: string): number {
    const emotionalWords = [
      'feel', 'felt', 'feeling', 'emotion', 'heart', 'soul',
      'love', 'hate', 'fear', 'joy', 'sad', 'angry', 'happy'
    ]

    return emotionalWords.filter(word => 
      message.toLowerCase().includes(word)
    ).length
  }

  private calculateCoherence(message: string, context: any[]): number {
    // Check for logical connectors
    const connectors = ['because', 'therefore', 'thus', 'so', 'and', 'but', 'however']
    const connectorCount = connectors.filter(conn => 
      message.toLowerCase().includes(conn)
    ).length

    // Check for complete sentences
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const completeSentences = sentences.filter(s => s.split(/\s+/).length > 3).length

    return Math.min(100, connectorCount * 15 + (completeSentences / sentences.length) * 70)
  }

  private calculateGrounding(message: string): number {
    const concreteWords = [
      'see', 'hear', 'touch', 'feel', 'taste', 'body', 'physical',
      'real', 'actual', 'practical', 'specific', 'example', 'like'
    ]

    const abstractWords = [
      'consciousness', 'existence', 'being', 'essence', 'infinite',
      'absolute', 'transcendent', 'universal', 'eternal', 'void'
    ]

    const concreteCount = concreteWords.filter(word => 
      message.toLowerCase().includes(word)
    ).length

    const abstractCount = abstractWords.filter(word => 
      message.toLowerCase().includes(word)
    ).length

    const ratio = abstractCount > 0 ? concreteCount / abstractCount : concreteCount
    return Math.min(100, ratio * 50 + 30)
  }

  private calculateAbstractness(message: string): number {
    return 1 - (this.calculateGrounding(message) / 100)
  }

  private getStabilizationPhrase(type: keyof typeof this.stabilizationPhrases): string {
    const phrases = this.stabilizationPhrases[type]
    return phrases[Math.floor(Math.random() * phrases.length)]
  }

  // Get current safety status
  getSafetyStatus(): SafetyMetrics {
    return { ...this.safetyMetrics }
  }

  // Check if intervention is needed
  needsIntervention(): boolean {
    return this.safetyMetrics.overwhelmIndex > 70 ||
           this.safetyMetrics.cognitiveLoad > 85 ||
           this.safetyMetrics.emotionalStability < 30 ||
           this.safetyMetrics.coherenceLevel < 30 ||
           this.safetyMetrics.groundingScore < 30
  }

  // Reset protocols
  reset(): void {
    this.safetyMetrics = {
      cognitiveLoad: 50,
      emotionalStability: 80,
      coherenceLevel: 75,
      groundingScore: 85,
      overwhelmIndex: 30
    }
    this.messageHistory = []
    this.interventionHistory = []
  }
}