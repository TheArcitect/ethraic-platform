// lib/crisis-protocols.ts
// Shared safety and crisis response logic

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface SafetyProtocol {
  active: boolean;
  level: RiskLevel;
  message: string;
}

export function createSafetyProtocol(riskLevel: RiskLevel): SafetyProtocol {
  const messages: Record<RiskLevel, string> = {
    LOW: 'Paradigm shift detected – normal support.',
    MODERATE: 'Paradigm shift detected – enhanced support mode.',
    HIGH: 'Paradigm crisis detected – crisis counseling mode.'
  };
  return {
    active: riskLevel !== 'LOW',
    level: riskLevel,
    message: messages[riskLevel]
  };
}
