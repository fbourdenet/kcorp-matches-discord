import { parisDay, parisTime } from './date.ts';
import type { Embed, EmbedField, GameId, Match, WebhookPayload } from './types.ts';

const MAX_FIELD_LENGTH = 1024;
const COLOR_BLUE = 0x0099ff;

/**
 * Served by GitHub from this repo, so it only shows once the repo is public and
 * pushed to main.
 */
const KC_LOGO_URL =
  'https://raw.githubusercontent.com/fbourdenet/kcorp-matches-discord/main/assets/kc-logo.png';

const GAME_LABELS: Record<GameId, string> = {
  leagueoflegends: 'League of Legends',
  rocketleague: 'Rocket League',
  valorant: 'Valorant',
  tft: 'Teamfight Tactics',
};

/**
 * Keeps a field value under the Discord limit, above which Discord rejects the
 * whole post. It cuts on a line break so a markdown link is never split.
 */
function truncate(value: string): string {
  if (value.length <= MAX_FIELD_LENGTH) return value;
  return `${value.slice(0, value.lastIndexOf('\n', MAX_FIELD_LENGTH - 2))}\n…`;
}

/**
 * Lists the matches of one game, two lines each.
 *
 * The 24 h window runs past midnight, so a match on the next Paris day gets
 * "(demain)". Without it, 00:30 under a recap "du jour" reads as this morning.
 */
function gameField(label: string, matches: readonly Match[], day: string): EmbedField {
  const lines = matches.flatMap((match) => [
    `🕙 ${parisTime(match.date)}${parisDay(match.date) === day ? '' : ' (demain)'} — ⚔️ ${match.teamLeft} vs ${match.teamRight}`,
    `> 🏆 ${match.tournament.name}${match.tournament.link ? ` · 🔗 [Bracket](${match.tournament.link})` : ''}`,
  ]);
  return { name: label, value: truncate(lines.join('\n')) };
}

/**
 * Builds the webhook payload for one day.
 *
 * Only the games with matches get a field. With no match at all, the
 * description says so. Failed pages are listed in the description too. The footer credits Liquipedia, as its CC BY-SA
 * license requires. The title says "du jour" when the target is today in Paris.
 */
export function buildPayload(
  matches: Match[],
  failures: readonly string[],
  targetDate: Date,
): WebhookPayload {
  const day = parisDay(targetDate);
  const embed: Embed = {
    title: `Récap des matchs KC du ${day === parisDay(new Date()) ? 'jour' : day}`,
    color: COLOR_BLUE,
    footer: { text: 'Source : Liquipedia (CC BY-SA 3.0)' },
    thumbnail: { url: KC_LOGO_URL },
    fields: Object.entries(GAME_LABELS).flatMap(([game, label]) => {
      const gameMatches = matches.filter((match) => match.game === game);
      return gameMatches.length > 0 ? [gameField(label, gameMatches, day)] : [];
    }),
  };

  const notes: string[] = [];
  if (matches.length === 0) notes.push("Aucun match trouvé pour aujourd'hui.");
  if (failures.length > 0) notes.push(`⚠️ Pages Liquipedia en échec : ${failures.join(', ')}.`);

  if (notes.length > 0) {
    embed.description = notes.join('\n');
  }

  return { embeds: [embed] };
}

/**
 * Posts the payload to a Discord webhook.
 *
 * shortcut: no retry. Ceiling: a Discord 5xx or 429 loses the post; re-run the
 * workflow manually. Upgrade: honor Retry-After and retry once.
 */
export async function sendPayload(webhookUrl: string, payload: WebhookPayload): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook ${response.status}: ${await response.text()}`);
  }
}
