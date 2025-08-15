// lib/metrics.ts
export type Weights = { entropy:number; clarity:number; novelty:number; depth:number; coherence:number };

const DEFAULT_WEIGHTS: Weights = { entropy:0.20, clarity:0.20, novelty:0.20, depth:0.20, coherence:0.20 };
const LMAX = Number(process.env.METRICS_DEPTH_LMAX ?? 400);

const normalizeText = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

export function tokenize(s: string): string[] {
  if (!s) return [];
  return normalizeText(s).split(" ").filter(Boolean);
}

export function entropyNorm(tokens: string[]): number {
  const n = tokens.length;
  if (n === 0) return 0;
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const V = freq.size;
  let H = 0;
  for (const [, c] of freq) {
    const p = c / n;
    H += -p * Math.log2(p);
  }
  const Hmax = Math.log2(Math.max(1, V));
  return Hmax > 0 ? clamp(H / Hmax) : 0;
}

export function clarityTTR(tokens: string[]): number {
  const n = tokens.length;
  if (n === 0) return 0;
  const V = new Set(tokens).size;
  return clamp(V / n);
}

export function depthScore(text: string): number {
  const tokens = tokenize(text);
  const lenScore = Math.log(1 + tokens.length) / Math.log(1 + LMAX);
  const markers = (text.match(/\b(because|therefore|thus|so that|hence|first|second|third)\b/gi) || []).length;
  const markerBoost = clamp(markers / 5);
  return clamp(0.7 * lenScore + 0.3 * markerBoost);
}

export function coherenceScore(tokens: string[]): number {
  const n = tokens.length;
  if (n < 2) return 1;
  const bigrams: string[] = [];
  for (let i = 0; i < n - 1; i++) bigrams.push(tokens[i] + " " + tokens[i + 1]);
  const seen = new Map<string, number>();
  let repeats = 0;
  for (const b of bigrams) {
    const c = (seen.get(b) ?? 0) + 1;
    seen.set(b, c);
    if (c === 2) repeats++;
  }
  const repRatio = repeats / Math.max(1, bigrams.length);
  return clamp(1 - repRatio);
}

export function noveltyScore(current: string[], historySet: Set<string>): number {
  if (current.length === 0) return 0;
  const curSet = new Set(current);
  let inter = 0, uni = 0;
  const unionTmp = new Set<string>(curSet);
  for (const w of historySet) unionTmp.add(w);
  uni = unionTmp.size;
  for (const w of curSet) if (historySet.has(w)) inter++;
  const jaccard = uni > 0 ? inter / uni : 0;
  return clamp(1 - jaccard);
}

export function compositeScore(
  weights: Weights,
  parts: { entropy: number; clarity: number; novelty: number; depth: number; coherence: number }
): number {
  const w = weights ?? DEFAULT_WEIGHTS;
  const s =
    w.entropy * parts.entropy +
    w.clarity * parts.clarity +
    w.novelty * parts.novelty +
    w.depth * parts.depth +
    w.coherence * parts.coherence;
  const sumW = w.entropy + w.clarity + w.novelty + w.depth + w.coherence;
  return sumW > 0 ? clamp(s / sumW) : 0;
}

export function ema(prev: number | null | undefined, now: number, alpha = 0.3): number {
  if (prev == null || Number.isNaN(prev)) return now;
  return alpha * now + (1 - alpha) * prev;
}

export function phaseFromComposite(c_ema: number): "SURFACE"|"EXPLORING"|"DEEP"|"INTEGRATION"|"BREAKTHROUGH" {
  if (c_ema < 0.30) return "SURFACE";
  if (c_ema < 0.50) return "EXPLORING";
  if (c_ema < 0.70) return "DEEP";
  if (c_ema < 0.85) return "INTEGRATION";
  return "BREAKTHROUGH";
}

export function parseWeights(env = process.env.METRICS_WEIGHTS): Weights {
  try { return { ...DEFAULT_WEIGHTS, ...(env ? JSON.parse(env) : {}) } as Weights; }
  catch { return DEFAULT_WEIGHTS; }
}

export function clamp(x: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, x)); }
