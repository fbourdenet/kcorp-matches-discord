import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPayload } from '../src/webhook.ts';
import { first, makeMatch } from './helpers.ts';

const DAY = new Date('2026-09-24T12:00:00.000Z');

describe('buildPayload: the Discord message of the day', () => {
  it('each game gets its own field, with its matches at Paris time, a bracket link and Liquipedia credited', () => {
    const matches = [
      makeMatch({ date: new Date('2026-09-24T10:00:00.000Z') }),
      makeMatch({ date: new Date('2026-09-24T18:00:00.000Z'), teamRight: 'Team Vitality' }),
    ];
    const embed = first(buildPayload(matches, [], DAY).embeds);

    assert.equal(embed.title, 'Récap des matchs KC du 2026-09-24');
    assert.equal(embed.description, undefined);
    assert.equal(embed.footer.text, 'Source : Liquipedia (CC BY-SA 3.0)');
    assert.match(embed.thumbnail.url, /\/assets\/kc-logo\.png$/);
    assert.deepEqual(
      embed.fields.map((field) => field.name),
      ['League of Legends', 'Rocket League', 'Valorant', 'Teamfight Tactics'],
    );

    const lol = first(embed.fields);
    assert.match(lol.value, /12:00 — ⚔️ Karmine Corp vs G2 Esports/);
    assert.match(lol.value, /20:00 — ⚔️ Karmine Corp vs Team Vitality/);
    assert.match(lol.value, /🔗 \[Bracket\]\(https:\/\/liquipedia\.net\/leagueoflegends\/LEC\)/);
  });

  it('a recap for today says "du jour" instead of the date', () => {
    const embed = first(buildPayload([], [], new Date()).embeds);

    assert.equal(embed.title, 'Récap des matchs KC du jour');
  });

  it('a game with no match today shows "Aucun match."', () => {
    const embed = first(buildPayload([], [], DAY).embeds);

    const rl = embed.fields.find((field) => field.name === 'Rocket League');
    assert.ok(rl);
    assert.equal(rl.value, 'Aucun match.');
  });

  it('pages that failed to load are listed on top, and the matches found still show', () => {
    const failures = ['Karmine_Corp (valorant)', 'Karmine_Corp_GC (valorant)'];
    const embed = first(buildPayload([makeMatch()], failures, DAY).embeds);

    assert.match(embed.description ?? '', /⚠️ .*Karmine_Corp \(valorant\), Karmine_Corp_GC/);
    assert.match(first(embed.fields).value, /20:30 — ⚔️ Karmine Corp vs G2 Esports/);
  });

  it('a game with 10 matches is cut to stay under the Discord limit of 1024 characters', () => {
    const matches = Array.from({ length: 10 }, () => makeMatch());
    const lol = first(first(buildPayload(matches, [], DAY).embeds).fields);

    assert.ok(lol.value.length <= 1024);
    assert.ok(lol.value.endsWith('\n…'));
  });
});
