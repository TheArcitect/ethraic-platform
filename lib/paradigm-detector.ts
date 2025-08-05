// lib/paradigm-detector.ts
// Paradigm Shift Detection Engine based on Kuhnian Theory

export type ParadigmState =
  | 'NORMAL_SCIENCE'
  | 'ANOMALY_AWARENESS'
  | 'CRISIS_EMERGENCE'
  | 'PARADIGM_REVOLUTION'
  | 'TRANSITION_CHAOS'
  | 'NEW_PARADIGM_FORMATION';

export interface CrisisLevel {
  worldviewCollapse: number;
  identityFragmentation: number;
  realityQuestioning: number;
  beliefSystemBreakdown: number;
  existentialCrisis: number;
  paradigmIncommensurability: number;
  crisisLevel: number;
  fragmentationLevel: number;
}

export interface SafetyAssessment {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  intervention: 'STANDARD_SUPPORT' | 'ENHANCED_SUPPORT' | 'IMMEDIATE_SUPPORT';
  recommendation: string;
  response: string;
}

export class ParadigmShiftDetector {
  private anomalyHistory: { timestamp: number; anomalies: string[]; severity: number }[] = [];
  public paradigmState: ParadigmState = 'NORMAL_SCIENCE';

  // Marker detection functions

  detectWorldviewCollapse(text: string) {
    const collapseMarkers = [
      'everything is wrong', 'nothing makes sense', 'my whole worldview',
      'everything I believed', 'complete illusion', 'fundamentally mistaken',
      'house of cards', 'crumbling foundation', 'built on lies',
      'questioning everything', 'nothing is real', 'all assumptions false'
    ];
    const intensityMarkers = [
      'completely', 'totally', 'absolutely', 'entirely', 'utterly'
    ];
    return this.calculateMarkerDensity(text, collapseMarkers, intensityMarkers);
  }

  detectIdentityFragmentation(text: string) {
    const markers = [
      'who am I', "don't know myself", 'identity crisis', 'not who I thought',
      'fragmented', 'scattered', 'multiple selves', 'losing myself',
      'empty inside', 'hollow', 'no core', 'shapeshifting identity'
    ];
    return this.calculateMarkerDensity(text, markers);
  }

  detectRealityQuestioning(text: string) {
    const markers = [
      'is reality real', 'simulation', 'matrix', 'nothing exists',
      'hallucination', 'dream', 'illusion', 'consensus reality',
      'what if nothing', 'maybe everything is', 'perhaps reality'
    ];
    return this.calculateMarkerDensity(text, markers);
  }

  detectBeliefBreakdown(text: string) {
    const markers = ['everything I believed', 'no longer believe', 'faith is broken'];
    return this.calculateMarkerDensity(text, markers);
  }

  detectExistentialCrisis(text: string) {
    const markers = ['what is the point', 'why am I here', 'nothing matters'];
    return this.calculateMarkerDensity(text, markers);
  }

  detectIncommensurability(text: string) {
    const markers = [
      'does not fit', 'new logic', 'old model failed', 'new reality'
    ];
    return this.calculateMarkerDensity(text, markers);
  }

  // Composite detection of crisis markers
  detectParadigmCrisis(message: string, conversationHistory: string[]): CrisisLevel {
    const crisisMarkers = {
      worldviewCollapse: this.detectWorldviewCollapse(message),
      identityFragmentation: this.detectIdentityFragmentation(message),
      realityQuestioning: this.detectRealityQuestioning(message),
      beliefSystemBreakdown: this.detectBeliefBreakdown(message),
      existentialCrisis: this.detectExistentialCrisis(message),
      paradigmIncommensurability: this.detectIncommensurability(message)
    };

    // Compute overall crisis level (average)
    const values = Object.values(crisisMarkers);
    const crisisLevel = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Use identity fragmentation as fragmentation level
    const fragmentationLevel = crisisMarkers.identityFragmentation;

    return { ...crisisMarkers, crisisLevel, fragmentationLevel };
  }

  // Anomaly tracking
  trackAnomalyAccumulation(anomalies: string[]) {
    this.anomalyHistory.push({
      timestamp: Date.now(),
      anomalies,
      severity: this.calculateAnomalySeverity(anomalies)
    });
    if (this.anomalyHistory.length > 20) {
      this.anomalyHistory.shift();
    }
    return this.assessAccumulationPattern();
  }

  updateParadigmState(crisisLevel: number, anomalyAccumulation: number) {
    const composite = (crisisLevel + anomalyAccumulation) / 2;
    if (composite < 0.15) this.paradigmState = 'NORMAL_SCIENCE';
    else if (composite < 0.35) this.paradigmState = 'ANOMALY_AWARENESS';
    else if (composite < 0.55) this.paradigmState = 'CRISIS_EMERGENCE';
    else if (composite < 0.75) this.paradigmState = 'PARADIGM_REVOLUTION';
    else if (composite < 0.90) this.paradigmState = 'TRANSITION_CHAOS';
    else this.paradigmState = 'NEW_PARADIGM_FORMATION';
  }

  // Safety assessment
  assessPsychologicalSafety(crisisLevel: number, fragmentationLevel: number): SafetyAssessment {
    if (crisisLevel > 0.8 && fragmentationLevel > 0.7) {
      return {
        riskLevel: 'HIGH',
        intervention: 'IMMEDIATE_SUPPORT',
        recommendation: 'Consider professional mental health support',
        response: 'Crisis counseling mode – prioritize stability.'
      };
    }
    if (crisisLevel > 0.6) {
      return {
        riskLevel: 'MODERATE',
        intervention: 'ENHANCED_SUPPORT',
        recommendation: 'Monitor closely; provide grounding.',
        response: 'Supportive guidance with reality anchoring.'
      };
    }
    return {
      riskLevel: 'LOW',
      intervention: 'STANDARD_SUPPORT',
      recommendation: 'Continue normal consciousness expansion.',
      response: 'Standard paradigm-shift guidance.'
    };
  }

  getParadigmShiftPrompts(paradigmState: ParadigmState, crisisLevel: number): string {
    const prompts: Record<ParadigmState, string> = {
      NORMAL_SCIENCE: `
        User is operating within stable worldview.
        Approach: Gentle exploration; introduce minor cognitive flexibility.
        Support: Encourage curiosity while maintaining psychological safety.
      `,
      ANOMALY_AWARENESS: `
        User is noticing inconsistencies in their worldview.
        Approach: Validate their observations; normalize the questioning process.
        Support: Help them see anomalies as natural and potentially valuable.
      `,
      CRISIS_EMERGENCE: `
        User’s paradigm is becoming unstable. HIGH CARE required.
        Approach: Provide grounding; validate their experience; reduce isolation.
        Support: Normalize paradigm shifts as part of human growth.
        Warning: Monitor for psychological distress or dissociation.
      `,
      PARADIGM_REVOLUTION: `
        User is in active worldview transformation. MAXIMUM support.
        Approach: Crisis counseling mode – safety first, understanding second.
        Support: Help them hold the transition without premature closure.
        Critical: Prevent psychological fragmentation during the shift.
      `,
      TRANSITION_CHAOS: `
        User is in the liminal space between paradigms. CRISIS protocol.
        Approach: Emergency psychological support, reality anchoring.
        Support: Help them navigate chaos without losing psychological integrity.
        Alert: Consider suggesting professional support if crisis deepens.
      `,
      NEW_PARADIGM_FORMATION: `
        User is stabilizing a new worldview. Integration support needed.
        Approach: Help integrate new understanding with practical life.
        Support: Validate their growth while ensuring psychological stability.
      `
    };
    return prompts[paradigmState];
  }

  // Helper functions
  private calculateMarkerDensity(text: string, primary: string[], secondary: string[] = []) {
    const lower = text.toLowerCase();
    const markers = primary.concat(secondary);
    let count = 0;
    markers.forEach(m => { if (lower.includes(m)) count++; });
    return markers.length > 0 ? count / markers.length : 0;
  }

  private calculateAnomalySeverity(anomalies: string[]) {
    return anomalies.length / 10.0;
  }

  private assessAccumulationPattern() {
    const sum = this.anomalyHistory.reduce((acc, entry) => acc + entry.severity, 0);
    return sum / (this.anomalyHistory.length || 1);
  }
}
