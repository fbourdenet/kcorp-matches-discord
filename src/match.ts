import type { Match } from './types.ts';

/**
 * Sorts the matches earliest first, without mutating the input.
 */
export function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => a.date.getTime() - b.date.getTime());
}
