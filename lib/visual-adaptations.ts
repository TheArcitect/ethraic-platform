// lib/visual-adaptations.ts
// ETHRAIC Visual Adaptation System
// Dynamic visual effects that respond to consciousness metrics

export interface VisualState {
  particleCount: number
  particleSpeed: number
  connectionDistance: number
  colorIntensity: number
  pulseFrequency: number
  glowRadius: number
  trailLength: number
  turbulence: number
}

export interface ColorScheme {
  primary: string
  secondary: string
  accent: string
  glow: string
  particles: string[]
}

export interface VisualEffect {
  type: 'burst' | 'wave' | 'spiral' | 'convergence' | 'divergence' | 'pulse' | 'vortex'
  intensity: number
  duration: number
  epicenter: { x: number, y: number }
  color: string
}

export class VisualAdaptationEngine {
  private visualState: VisualState
  private activeEffects: VisualEffect[] = []
  private colorSchemes: Record<string, ColorScheme>
  private currentScheme: string = 'default'
  
  constructor() {
    this.visualState = this.getDefaultState()
    this.colorSchemes = this.initializeColorSchemes()
  }

  private getDefaultState(): VisualState {
    return {
      particleCount: 50,
      particleSpeed: 0.5,
      connectionDistance: 150,
      colorIntensity: 0.5,
      pulseFrequency: 0.05,
      glowRadius: 2,
      trailLength: 0.05,
      turbulence: 0
    }
  }

  private initializeColorSchemes(): Record<string, ColorScheme> {
    return {
      default: {
        primary: '#3B82F6', // Blue
        secondary: '#8B5CF6', // Purple
        accent: '#F59E0B', // Orange
        glow: 'rgba(59, 130, 246, 0.5)',
        particles: [
          'rgba(255, 255, 255, 0.1)',
          'rgba(59, 130, 246, 0.2)',
          'rgba(139, 92, 246, 0.2)'
        ]
      },
      breakthrough: {
        primary: '#F59E0B', // Orange
        secondary: '#EF4444', // Red
        accent: '#FBBF24', // Yellow
        glow: 'rgba(245, 158, 11, 0.7)',
        particles: [
          'rgba(245, 158, 11, 0.3)',
          'rgba(239, 68, 68, 0.3)',
          'rgba(251, 191, 36, 0.3)'
        ]
      },
      deep: {
        primary: '#6366F1', // Indigo
        secondary: '#7C3AED', // Violet
        accent: '#06B6D4', // Cyan
        glow: 'rgba(99, 102, 241, 0.6)',
        particles: [
          'rgba(99, 102, 241, 0.2)',
          'rgba(124, 58, 237, 0.2)',
          'rgba(6, 182, 212, 0.2)'
        ]
      },
      flow: {
        primary: '#10B981', // Emerald
        secondary: '#06B6D4', // Cyan
        accent: '#3B82F6', // Blue
        glow: 'rgba(16, 185, 129, 0.5)',
        particles: [
          'rgba(16, 185, 129, 0.2)',
          'rgba(6, 182, 212, 0.2)',
          'rgba(59, 130, 246, 0.2)'
        ]
      },
      integration: {
        primary: '#8B5CF6', // Purple
        secondary: '#EC4899', // Pink
        accent: '#6366F1', // Indigo
        glow: 'rgba(139, 92, 246, 0.6)',
        particles: [
          'rgba(139, 92, 246, 0.3)',
          'rgba(236, 72, 153, 0.3)',
          'rgba(99, 102, 241, 0.3)'
        ]
      }
    }
  }

  // Adapt visuals based on consciousness metrics
  adaptToMetrics(metrics: any): VisualState {
    // Particle count scales with depth and connections
    this.visualState.particleCount = Math.min(200, 
      30 + Math.round(metrics.depth * 0.5 + metrics.connections * 0.5)
    )

    // Speed increases with insight velocity and flow state
    this.visualState.particleSpeed = 0.3 + 
      (metrics.insightVelocity / 100) * 0.5 + 
      (metrics.flowState / 100) * 0.3

    // Connection distance expands with resonance
    this.visualState.connectionDistance = 100 + metrics.resonance

    // Color intensity reflects clarity
    this.visualState.colorIntensity = 0.3 + (metrics.clarity / 100) * 0.7

    // Pulse frequency syncs with paradigm shift potential
    this.visualState.pulseFrequency = 0.02 + (metrics.paradigmShift / 100) * 0.08

    // Glow radius indicates emergence
    this.visualState.glowRadius = 1 + (metrics.emergence / 100) * 4

    // Trail length shows momentum
    this.visualState.trailLength = 0.02 + (metrics.insightVelocity / 100) * 0.08

    // Turbulence reflects conceptual leaps
    this.visualState.turbulence = metrics.conceptualLeaps * 0.1

    // Select color scheme based on phase
    this.selectColorScheme(metrics)

    return { ...this.visualState }
  }

  // Select appropriate color scheme based on metrics
  private selectColorScheme(metrics: any): void {
    if (metrics.paradigmShift > 70) {
      this.currentScheme = 'breakthrough'
    } else if (metrics.depth > 70) {
      this.currentScheme = 'deep'
    } else if (metrics.flowState > 70) {
      this.currentScheme = 'flow'
    } else if (metrics.emergence > 60 && metrics.resonance > 60) {
      this.currentScheme = 'integration'
    } else {
      this.currentScheme = 'default'
    }
  }

  // Trigger visual effect based on event
  triggerEffect(type: VisualEffect['type'], metrics: any, position?: { x: number, y: number }): VisualEffect {
    const effect: VisualEffect = {
      type,
      intensity: this.calculateEffectIntensity(type, metrics),
      duration: this.calculateEffectDuration(type, metrics),
      epicenter: position || { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      color: this.getEffectColor(type)
    }

    this.activeEffects.push(effect)
    
    // Clean up old effects
    setTimeout(() => {
      this.activeEffects = this.activeEffects.filter(e => e !== effect)
    }, effect.duration)

    return effect
  }

  // Calculate effect intensity based on type and metrics
  private calculateEffectIntensity(type: VisualEffect['type'], metrics: any): number {
    const intensityMap: Record<VisualEffect['type'], number> = {
      burst: (metrics.paradigmShift || 50) / 100,
      wave: (metrics.resonance || 50) / 100,
      spiral: (metrics.depth || 50) / 100,
      convergence: (metrics.clarity || 50) / 100,
      divergence: (metrics.emergence || 50) / 100,
      pulse: (metrics.flowState || 50) / 100,
      vortex: (metrics.conceptualLeaps || 0) / 5
    }

    return Math.min(1, intensityMap[type] || 0.5)
  }

  // Calculate effect duration
  private calculateEffectDuration(type: VisualEffect['type'], metrics: any): number {
    const baseDuration = {
      burst: 1000,
      wave: 2000,
      spiral: 3000,
      convergence: 2500,
      divergence: 2500,
      pulse: 1500,
      vortex: 4000
    }

    const duration = baseDuration[type] || 2000
    const modifier = 1 + (metrics.paradigmShift || 50) / 100

    return duration * modifier
  }

  // Get color for effect type
  private getEffectColor(type: VisualEffect['type']): string {
    const scheme = this.colorSchemes[this.currentScheme]
    
    const colorMap: Record<VisualEffect['type'], string> = {
      burst: scheme.accent,
      wave: scheme.primary,
      spiral: scheme.secondary,
      convergence: scheme.primary,
      divergence: scheme.accent,
      pulse: scheme.glow,
      vortex: scheme.secondary
    }

    return colorMap[type] || scheme.primary
  }

  // Generate particle system parameters
  generateParticleParams(): any {
    const scheme = this.colorSchemes[this.currentScheme]
    
    return {
      count: this.visualState.particleCount,
      speed: this.visualState.particleSpeed,
      connectionDistance: this.visualState.connectionDistance,
      colors: scheme.particles,
      glowColor: scheme.glow,
      glowRadius: this.visualState.glowRadius,
      pulseFrequency: this.visualState.pulseFrequency,
      trailLength: this.visualState.trailLength,
      turbulence: this.visualState.turbulence
    }
  }

  // Get CSS variables for current visual state
  getCSSVariables(): Record<string, string> {
    const scheme = this.colorSchemes[this.currentScheme]
    
    return {
      '--ethraic-primary': scheme.primary,
      '--ethraic-secondary': scheme.secondary,
      '--ethraic-accent': scheme.accent,
      '--ethraic-glow': scheme.glow,
      '--ethraic-intensity': this.visualState.colorIntensity.toString(),
      '--ethraic-pulse': `${this.visualState.pulseFrequency}s`,
      '--ethraic-blur': `${this.visualState.glowRadius}px`
    }
  }

  // Generate animation keyframes based on current state
  generateAnimationKeyframes(): string {
    const intensity = this.visualState.colorIntensity
    const pulseScale = 1 + this.visualState.pulseFrequency * 10
    
    return `
      @keyframes ethraic-pulse {
        0% { transform: scale(1); opacity: ${intensity}; }
        5