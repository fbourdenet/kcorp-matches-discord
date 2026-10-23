import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseMatches } from '../src/liquipedia.ts';
import { first } from './helpers.ts';

/**
 * The daily run: 08:00 in Paris, so 06:00 UTC in September.
 */
const RUN = new Date('2026-09-24T06:00:00.000Z');
const GAME = 'leagueoflegends' as const;

function unix(iso: string): number {
  return Math.floor(Date.parse(iso) / 1000);
}

interface ItemOptions {
  timestamp?: number;
  leftName?: string;
  rightName?: string;
  withTimer?: boolean;
  withLink?: boolean;
}

function item(options: ItemOptions = {}): string {
  const {
    timestamp = unix('2026-09-24T10:00:00.000Z'),
    leftName = 'Karmine Corp',
    rightName = 'G2 Esports',
    withTimer = true,
    withLink = true,
  } = options;

  const left = withLink ? `<a href="/leagueoflegends/Karmine_Corp">${leftName}</a>` : leftName;
  const right = withLink ? `<a href="/leagueoflegends/G2_Esports">${rightName}</a>` : rightName;
  const timer = withTimer
    ? `<span class="timer-object" data-timestamp="${timestamp}">countdown</span>`
    : '';

  return `
    <div class="carousel-item">
      <div class="match-info match-info--vertical">
        <div class="match-info-opponent-row">
          <span class="block-team"><span class="name">${left}</span></span>
        </div>
        <div class="match-info-opponent-row">
          <span class="block-team"><span class="name">${right}</span></span>
        </div>
        <div class="match-info-tournament-name">
          <a href="/leagueoflegends/LEC/2026/Summer/Playoffs#Playoffs">LEC 2026 Summer Playoffs</a>
        </div>
        ${timer}
      </div>
    </div>`;
}

function page(items: string): string {
  return `<html><body><div class="carousel"><div class="carousel-content">${items}</div></div></body></html>`;
}

describe('parseMatches: reading the match carousel of a Liquipedia team page', () => {
  it('a match later today gives its teams, tournament, bracket link, date and game', () => {
    const match = first(parseMatches(page(item()), GAME, RUN));

    assert.equal(match.teamLeft, 'Karmine Corp');
    assert.equal(match.teamRight, 'G2 Esports');
    assert.equal(match.tournament.name, 'LEC 2026 Summer Playoffs');
    assert.equal(match.date.toISOString(), '2026-09-24T10:00:00.000Z');
    assert.equal(match.game, 'leagueoflegends');
    assert.equal(
      match.tournament.link,
      'https://liquipedia.net/leagueoflegends/LEC/2026/Summer/Playoffs#Playoffs',
    );
  });

  it('a match tonight at 00:30 in Paris is in the morning post, before it starts', () => {
    const html = page(item({ timestamp: unix('2026-09-24T22:30:00.000Z') }));
    assert.equal(parseMatches(html, GAME, RUN).length, 1);
  });

  it('a match that started before the run, at 07:00 in Paris, is left out', () => {
    const html = page(item({ timestamp: unix('2026-09-24T05:00:00.000Z') }));
    assert.equal(parseMatches(html, GAME, RUN).length, 0);
  });

  it('a match after the next run, at 09:00 in Paris tomorrow, is left for tomorrow', () => {
    const html = page(item({ timestamp: unix('2026-09-25T07:00:00.000Z') }));
    assert.equal(parseMatches(html, GAME, RUN).length, 0);
  });

  it('a match with no scheduled time yet is left out', () => {
    assert.equal(parseMatches(page(item({ withTimer: false })), GAME, RUN).length, 0);
  });

  it('a team name in plain text, with no link to its page, is still read', () => {
    const html = page(item({ withLink: false }));
    assert.equal(first(parseMatches(html, GAME, RUN)).teamRight, 'G2 Esports');
  });
});
