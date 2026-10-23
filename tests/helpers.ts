import type { Match } from '../src/types.ts';

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    teamLeft: 'Karmine Corp',
    teamRight: 'G2 Esports',
    tournament: {
      name: 'LEC 2026 Summer Playoffs',
      link: 'https://liquipedia.net/leagueoflegends/LEC',
    },
    date: new Date('2026-09-24T18:30:00.000Z'),
    game: 'leagueoflegends',
    ...overrides,
  };
}

export function first<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error('Expected at least one item');
  return item;
}
