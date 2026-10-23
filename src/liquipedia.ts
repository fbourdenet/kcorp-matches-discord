import { setTimeout as sleep } from 'node:timers/promises';
import type { Cheerio } from 'cheerio';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import config from './config.ts';
import type { GameId, Match, Tournament } from './types.ts';

const REQUEST_INTERVAL_MS = 30_000;
const FETCH_TIMEOUT_MS = 15_000;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function readTeam(row: Cheerio<Element>): string | null {
  const name = row.find('.block-team span.name');
  const link = name.find('a');

  return (link.length > 0 ? link : name).text().trim() || null;
}

function readTeams(matchInfo: Cheerio<Element>): { teamLeft: string; teamRight: string } | null {
  const rows = matchInfo.find('.match-info-opponent-row');
  const teamLeft = readTeam(rows.eq(0));
  const teamRight = readTeam(rows.eq(1));

  return teamLeft && teamRight ? { teamLeft, teamRight } : null;
}

function readTournament(matchInfo: Cheerio<Element>): Tournament {
  const link = matchInfo.find('.match-info-tournament-name a');
  const href = link.attr('href');

  return {
    name: link.text().trim() || 'Tournoi inconnu',
    link: href ? new URL(href, config.liquipedia.apiUrl).href : null,
  };
}

/**
 * Reads the match start from its countdown timer, given in Unix seconds.
 *
 * A match with no scheduled time has no timer. Number(undefined) is NaN, which
 * fails the `> 0` check, so the match gets no date.
 */
function readDate(matchInfo: Cheerio<Element>): Date | null {
  const timestamp = Number(matchInfo.find('.timer-object').attr('data-timestamp'));

  return timestamp > 0 ? new Date(timestamp * 1000) : null;
}

/**
 * Extracts the matches scheduled in the 24 hours after `from`.
 *
 * A team page shows its upcoming matches in a carousel, one `.carousel-item`
 * per match. tests/liquipedia.test.ts holds a copy of the expected markup.
 *
 * It is a 24 h window, not a calendar day. The post goes out in the morning, so
 * a match at 00:30 tonight belongs in it, and one at 03:00 this morning is over.
 */
export function parseMatches(html: string, game: GameId, from: Date): Match[] {
  const $ = cheerio.load(html);
  const matches: Match[] = [];

  for (const item of $('.carousel .carousel-content .carousel-item').toArray()) {
    const matchInfo = $(item).find('.match-info.match-info--vertical');
    const teams = readTeams(matchInfo);
    const date = readDate(matchInfo);

    if (!teams || !date || date < from || date.getTime() >= from.getTime() + WINDOW_MS) {
      continue;
    }

    matches.push({ ...teams, tournament: readTournament(matchInfo), date, game });
  }

  return matches;
}

/**
 * Fetches the rendered HTML of one team page through the MediaWiki API.
 *
 * action=parse returns the page as HTML. section=0 keeps only the top of the
 * page, where the match carousel is.
 */
async function fetchPageHtml(teamId: string, game: GameId): Promise<string> {
  const url = `${config.liquipedia.apiUrl}/${game}/api.php?action=parse&page=${encodeURIComponent(teamId)}&format=json&prop=text&section=0`;
  const response = await fetch(url, {
    headers: { 'User-Agent': config.userAgent },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Liquipedia ${response.status} pour ${teamId} (${game}).`);
  }

  const payload = (await response.json()) as { parse?: { text?: { '*'?: string } } };
  const html = payload.parse?.text?.['*'];
  if (!html) {
    throw new Error(`Aucun contenu pour ${teamId} (${game}).`);
  }
  return html;
}

/**
 * Fetches every watched page, one after the other. A failed page is logged and
 * listed in `failures`, so a run still posts what it has. When every page
 * fails, it throws instead, so the run exits with code 1 and the scheduler can
 * report it.
 *
 * The Liquipedia ToS allow at most one action=parse request every 30 seconds,
 * hence the pause between two pages.
 *
 * shortcut: HTML scraping instead of the LPDB API. Ceiling: one page per game,
 * 30 s apart, and a markup change breaks the parser. Upgrade: LPDB v3.
 */
export async function getMatches(from: Date): Promise<{ matches: Match[]; failures: string[] }> {
  const matches: Match[] = [];
  const failures: string[] = [];
  const pages = config.liquipedia.teams.flatMap(({ teamId, gameIds }) =>
    gameIds.map((game) => ({ teamId, game })),
  );

  for (const [index, { teamId, game }] of pages.entries()) {
    if (index > 0) await sleep(REQUEST_INTERVAL_MS);

    try {
      const html = await fetchPageHtml(teamId, game);
      const found = parseMatches(html, game, from);

      console.log(`${teamId} (${game}) : ${found.length} match(s)`);
      matches.push(...found);
    } catch (error) {
      console.error(
        `échec ${teamId} (${game}) : ${error instanceof Error ? error.message : error}`,
      );
      failures.push(`${teamId} (${game})`);
    }
  }

  if (failures.length === pages.length) {
    throw new Error('Toutes les pages Liquipedia sont en échec, rien à poster.');
  }

  return { matches, failures };
}
