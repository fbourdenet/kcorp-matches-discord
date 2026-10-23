import type { Team } from './types.ts';

const TEAMS: readonly Team[] = [
  { teamId: 'Karmine_Corp', gameIds: ['leagueoflegends', 'rocketleague', 'valorant', 'tft'] },
  { teamId: 'Karmine_Corp_Blue', gameIds: ['leagueoflegends'] },
  { teamId: 'Karmine_Corp_Blue_Stars', gameIds: ['leagueoflegends', 'valorant'] },
  { teamId: 'Karmine_Corp_GC', gameIds: ['valorant'] },
];

export default {
  userAgent: process.env.LIQUIPEDIA_USER_AGENT || '',
  webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  dryRun: process.env.DRY_RUN === '1',
  targetDate: process.env.TARGET_DATE ? new Date(process.env.TARGET_DATE) : null,
  liquipedia: {
    apiUrl: 'https://liquipedia.net',
    teams: TEAMS,
  },
};
