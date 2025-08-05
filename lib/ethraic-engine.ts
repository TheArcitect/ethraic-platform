import Anthropic from '@anthropic-ai/sdk'

export class ETHRAICEngine {
  private anthropic: Anthropic | null = null

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
  }

  async process(input: string, mode: string = 'personal') {
    // Calculate metrics
    const clarity = 0.5 + (Math.random() * 0.5)
    const depth = input.split(' ').length > 10 ? 0.7 + (Math.random() * 0.3) : 0.3 + (Math.random() * 0.4)
    
    if (!this.anthropic) {
      return {
        response: 'API keys not configured. Add ANTHROPIC_API_KEY to .env.local',
        clarity,
        depth
      }
    }
    
    try {
      const systemPrompt = this.getSystemPrompt(mode)
      
      const message = await this.anthropic!.messages.create({
model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: input
        }]
      })
      
      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : 'Unable to process'
      
      return {
        response: responseText,
        clarity,
        depth
      }
    } catch (error) {
      console.error('Claude error:', error)
      return {
        response: 'Processing error. Check API configuration.',
        clarity: 0,
        depth: 0
      }
    }
  }

  private getSystemPrompt(mode: string): string {
    const prompts = {
      personal: 'You are ETHRAIC, a co-intelligence system. Provide brief, insightful responses that help users think better. Be concise, clear, and thought-provoking.',
      team: 'You are ETHRAIC for teams. Help groups explore ideas collaboratively. Focus on synthesis, alignment, and collective intelligence.',
      enterprise: 'You are ETHRAIC for enterprise. Identify systemic patterns, strategic insights, and organizational intelligence. Be direct and actionable.'
    }
    
    return prompts[mode as keyof typeof prompts] || prompts.personal
  }
}
