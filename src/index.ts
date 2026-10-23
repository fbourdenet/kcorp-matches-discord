import config from './config.ts';
import { getMatches } from './liquipedia.ts';
import { sortMatches } from './match.ts';
import { buildPayload, sendPayload } from './webhook.ts';

/**
 * Fetches every Liquipedia team page, keeps the matches of the next 24 hours,
 * builds one Discord embed and posts it.
 *
 * A run lasts about 3 min 30 because of the Liquipedia rate limit. A failed page
 * does not stop the run, it is listed in the post. DRY_RUN prints the payload
 * instead of posting it, so it needs no webhook. TARGET_DATE starts the window
 * at another date, past or future.
 *
 * The Liquipedia ToS require a User-Agent with a contact. It has no default, so
 * that no personal contact ends up in the repo.
 */

if (!config.userAgent) {
  throw new Error('LIQUIPEDIA_USER_AGENT manquant. Copie .env.example vers .env.');
}

if (!config.dryRun && !config.webhookUrl) {
  throw new Error('DISCORD_WEBHOOK_URL manquant. Copie .env.example vers .env.');
}

const date = config.targetDate ?? new Date();

const { matches, failures } = await getMatches(date);
const sortedMatches = sortMatches(matches);

const payload = buildPayload(sortedMatches, failures, date);

console.log(`${sortedMatches.length} match(s).`);

if (config.dryRun) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  await sendPayload(config.webhookUrl, payload);
}
