import Anthropic from '@anthropic-ai/sdk'
import { ParadigmShiftDetector } from './paradigm-detector'
import { createSafetyProtocol } from './crisis-protocols'


export interface ConsciousnessMetrics {
  entropy: number
  uncertainty: number
  paradox: number
  depth: number
  breakthrough: number
}

export type ConsciousnessPhase =
  | 'SURFACE'
  | 'QUESTIONING'
  | 'UNCERTAINTY'
  | 'PARADOX'
  | 'INTEGRATION'
  | 'TRANSCENDENT'


export class ConsciousnessEngine {
  
  private anthropic: Anthropic
  private paradigmDetector: ParadigmShiftDetector


  
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    this.paradigmDetector = new ParadigmShiftDetector()
  }

  calculateEntropy(text: string): number {
    const freq: { [key: string]: number } = {};
    for (const ch of text) {
      freq[ch] = (freq[ch] || 0) + 1;
    }
    let entropy = 0;
    const len = text.length;
    for (const ch in freq) {
      const p = freq[ch] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  /**
   * Analyze a message and return metrics + phase.
   */
  analyzeMessage(text: string): { metrics: ConsciousnessMetrics; phase: ConsciousnessPhase } {
  
    const lower = text.toLowerCase()
    
    const words = lower.split(/\s+/).filter(Boolean)
    const wordCount = words.length

    // Uncertainty detection
    const uncertaintyWords = ['maybe', 'perhaps', 'unsure', 'not sure', 'uncertain', 'guess']
    let uncertainCount = 0
    for (const w of uncertaintyWords) {
      if (lower.includes(w)) {
        uncertainCount++
      }
    }
    // Count question marks as additional uncertainty
  
    const questionMarks = (text.match(/\?/g) || []).length
    const uncertaintyScore = Math.min(uncertainCount / 3 + questionMarks / 5, 1)

    

    // Paradox detection
    const paradoxWords = ['but', 'however', 'yet', 'paradox', 'contradiction', 'contradictory']
    let paradoxCount = 0
    
    for (
      const w of paradoxWords) {
      if (lower.includes(w)) {
        paradoxCount++
      }
    }
    const paradoxScore = Math.min(paradoxCount / 3, 1)

    // Depth based on message length (normalized)
    const depthScore = Math.min(wordCount / 20, 1)

    // Breakthrough detection
    const breakthroughWords = ['suddenly', 'realize', 'epiphany', 'breakthrough']
    let breakthroughCount = 0
    for (const w of breakthroughWords) {
      if (lower.includes(w)) {
        breakthroughCount++
      }
    }
 
    const breakthroughScore = Math.min(breakthroughCount / 2, 1)

    const entropy = this.calculateEntropy(text)

    const metrics: ConsciousnessMetrics = {
      entropy,
      uncertainty: uncertaintyScore,
      paradox: paradoxScore,
      
      depth: depthScore,
      breakthrough: breakthroughScore,
    }

    // Phase determination
    let phase: ConsciousnessPhase = 'SURFACE'
    const composite =
      (metrics.entropy +
        metrics.uncertainty +
        metrics.paradox +
        metrics.depth +
        metrics.breakthrough) /
      5

    if (composite > 0.9) {
      phase = 'TRANSCENDENT'
    } else if (metrics.depth > 0.7 && metrics.entropy > 0.6) {
      phase = 'INTEGRATION'
    } else if (metrics.paradox > 0.5) {
      phase = 'PARADOX'
    } else if (metrics.uncertainty > 0.6) {
     
      phase = 'UNCERTAINTY'
    } else if (metrics.uncertainty > 0.4) {
      phase = 'QUESTIONING'
    }

    return { metrics, phase }
  }

  /**
   * Generate a system prompt based on the detected phase.
   */
  private generateSystemPrompt(phase: ConsciousnessPhase): string {

    const prompts: Record<ConsciousnessPhase, string> = {
      SURFACE:
        'You are ETHRAIC, a co-intelligence system. Provide clear, concise responses to initiate deeper thinking.',
      QUESTIONING:
       
        
        'You are ETHRAIC guiding a questioning user. Encourage curiosity and exploration of underlying assumptions.',
      UNCERTAINTY:
        'You are ETHRAIC. Help the user embrace not-knowing and inquire into possibilities without needing certainty.',
      PARADOX:
        'You are ETHRAIC. Assist the user in holding contradictions and seeing both sides with equanimity.',
      INTEGRATION:
        'You are ETHRAIC synthesizing patterns. Connect insights into coherent understanding and next steps.',
      TRANSCENDENT:
        'You are ETHRAIC in a transcendent state. Provide expansive, visionary responses pointing toward interconnectedness.',
    }
    return prompts[phase] || prompts.SURFACE
  }

  /**
   * Generate a complete response from Claude with consciousness analysis.
   */
  async generateResponse(input: string, mode: string = 'personal') {
    // Analyze message for consciousness metrics and phase
    const { metrics, phase } = this.analyzeMessage(input);
    const systemPrompt = this.generateSystemPrompt(phase);

    // Paradigm crisis detection
    const crisisInfo = this.paradigmDetector.detectParadigmCrisis(input, []);
    const anomalyAccum = this.paradigmDetector.trackAnomalyAccumulation([]);
    this.paradigmDetector.updateParadigmState(
      crisisInfo.crisisLevel,
      anomalyAccum
    );
    
    const safetyAssessment = this.paradigmDetector.assessPsychologicalSafety(
      crisisInfo.crisisLevel,
      crisisInfo.fragmentationLevel
    );
    const paradigmPrompt = this.paradigmDetector.getParadigmShiftPrompts(
      this.paradigmDetector.paradigmState,
      crisisInfo.crisisLevel
    );
    const enhancedSystemPrompt = [
      systemPrompt,
      '',
      'PARADIGM SHIFT CONTEXT:',
      paradigmPrompt,
      '',
      'SAFETY PROTOCOL:',
      safetyAssessment.response,
      '',
      safetyAssessment.riskLevel === 'HIGH'
        ? 'CRITICAL: User may be experiencing paradigm crisis. Prioritize psychological safety and stability.'
        : '',
    ].join('\n');
    const safetyProtocol = createSafetyProtocol(safetyAssessment.riskLevel);

    try {
      // Call Anthropic with enhanced prompt
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: enhancedSystemPrompt,
        messages: [{ role: 'user', content: input }],
      });

      const contentBlock = message.content[0];
      const responseText =
        contentBlock && contentBlock.type === 'text'
          ? contentBlock.text
          : 'Unable to process';

      // Clarity inversely related to uncertainty
      const clarity = 1 - metrics.uncertainty;

      return {
        response: responseText,
        phase,
        metrics,
        clarity,
        depth: metrics.depth,
        paradigmData: {
          state: this.paradigmDetector.paradigmState,
          crisisLevel: crisisInfo.crisisLevel,
          safetyLevel: safetyAssessment.riskLevel,
          intervention: safetyAssessment.intervention,
          fragmentationLevel: crisisInfo.fragmentationLevel,
        },
        safetyProtocol,
      };
    } catch (error: any) {
      console.error('ConsciousnessEngine error:', error);
      return {
        response: 'Processing error. Check API configuration.',
        phase: 'SURFACE' as ConsciousnessPhase,
        metrics,
        clarity: 0,
        depth: 0,
        paradigmData: {
          state: this.paradigmDetector.paradigmState,
          crisisLevel: crisisInfo.crisisLevel,
          safetyLevel: 'LOW',
          intervention: 'STANDARD_SUPPORT',
          fragmentationLevel: crisisInfo.fragmentationLevel,
        },
        safetyProtocol: createSafetyProtocol('LOW'),
      };
    }
  }

  /**
   * Return metrics only (for UI or logs).
   */
  getInsights(input: string): { metrics: ConsciousnessMetrics; phase: ConsciousnessPhase } {
    return this.analyzeMessage(input)
  }
}
