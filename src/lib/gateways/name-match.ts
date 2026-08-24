/**
 * Beneficiary name matching for penny-drop verification.
 *
 * The name a bank holds rarely matches what a user types: initials, honorifics,
 * reordered words, missing middle names. A strict equality check would reject
 * most legitimate accounts, and accepting anything would defeat the purpose —
 * so we score similarity and let the caller apply a threshold.
 */

const HONORIFICS = new Set([
  'mr', 'mrs', 'ms', 'miss', 'dr', 'shri', 'smt', 'sri', 'md', 'prof', 'kum',
]);

function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !HONORIFICS.has(t));
}

/** Jaro-Winkler — tolerant of transpositions and shared prefixes. */
function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const matchWindow = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aFlags = new Array<boolean>(a.length).fill(false);
  const bFlags = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bFlags[j] || a[i] !== b[j]) continue;
      aFlags[i] = true;
      bFlags[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aFlags[i]) continue;
    while (!bFlags[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - transpositions) / m) / 3;

  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Scores two beneficiary names in [0,1].
 *
 * Strategy: match tokens greedily best-to-best so word order doesn't matter,
 * and treat a single-letter token as an initial that matches any token starting
 * with the same letter ("R" ↔ "Rajesh"). The score is the mean over the tokens
 * of the *shorter* name, so "Rajesh Kumar" vs "Rajesh Kumar Sharma" stays high
 * while "Rajesh Kumar" vs "Priya Nair" stays near zero.
 */
export function nameMatchScore(submitted: string, registered: string): number {
  const a = tokens(submitted);
  const b = tokens(registered);
  if (!a.length || !b.length) return 0;

  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const used = new Set<number>();
  let total = 0;

  for (const t of short) {
    let best = 0;
    let bestIdx = -1;
    for (let i = 0; i < long.length; i++) {
      if (used.has(i)) continue;
      const u = long[i]!;
      let s: number;
      if (t.length === 1 || u.length === 1) {
        // Initial-vs-word: credit a first-letter hit, but not fully.
        s = t[0] === u[0] ? 0.9 : 0;
      } else {
        s = jaroWinkler(t, u);
      }
      if (s > best) {
        best = s;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) used.add(bestIdx);
    total += best;
  }

  return Math.min(1, total / short.length);
}

/**
 * Withdrawals unlock at ≥ 0.80. Between 0.60 and 0.80 the account is held for
 * manual review rather than silently rejected, because a genuine user with a
 * shortened name shouldn't lose access to their own money.
 */
export const NAME_MATCH_PASS = 0.8;
export const NAME_MATCH_REVIEW = 0.6;

export type NameMatchVerdict = 'pass' | 'review' | 'fail';

export function nameMatchVerdict(score: number | null | undefined): NameMatchVerdict {
  if (score == null) return 'fail';
  if (score >= NAME_MATCH_PASS) return 'pass';
  if (score >= NAME_MATCH_REVIEW) return 'review';
  return 'fail';
}
