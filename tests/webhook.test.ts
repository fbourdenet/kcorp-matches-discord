import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildPayload } from '../src/webhook.ts';
import { first, makeMatch } from './helpers.ts';

const DAY = new Date('2026-09-24T12:00:00.000Z');

describe('buildPayload: the Discord message of the day', () => {
  it('a game with matches gets its own field, at Paris time, with a bracket link and Liquipedia credited', () => {
    const matches = [
      makeMatch({ date: new Date('2026-09-24T10:00:00.000Z') }),
      makeMatch({ date: new Date('2026-09-24T18:00:00.000Z'), teamRight: 'Team Vitality' }),
    ];
    const embed = first(buildPayload(matches, [], DAY).embeds);

    assert.equal(embed.title, 'Récap des matchs KC du 2026-09-24');
    assert.equal(embed.description, undefined);
    assert.equal(embed.footer.text, 'Source : Liquipedia (CC BY-SA 3.0)');
    assert.match(embed.thumbnail.url, /\/assets\/kc-logo\.png$/);

    const lol = first(embed.fields);
    assert.match(
      lol.value,
      /🕙 12:00\n⚔️ Karmine Corp vs G2 Esports\n🏆 LEC 2026 Summer Playoffs\n🔗 \[Bracket\]/,
    );
    assert.match(lol.value, /🕙 20:00\n⚔️ Karmine Corp vs Team Vitality/);
    assert.match(lol.value, /🔗 \[Bracket\]\(https:\/\/liquipedia\.net\/leagueoflegends\/LEC\)/);
  });

  it('a recap for today says "du jour" instead of the date', () => {
    const embed = first(buildPayload([], [], new Date()).embeds);

    assert.equal(embed.title, 'Récap des matchs KC du jour');
  });

  it('a match after midnight in Paris is marked "(demain)"', () => {
    const tonight = makeMatch({ date: new Date('2026-09-24T22:30:00.000Z') });
    const lol = first(first(buildPayload([tonight], [], DAY).embeds).fields);

    assert.match(lol.value, /🕙 00:30 \(demain\)\n⚔️ Karmine Corp vs G2 Esports/);
  });

  it('a day with no match posts "Aucun match trouvé pour aujourd\'hui." and no field', () => {
    const embed = first(buildPayload([], [], DAY).embeds);

    assert.equal(embed.description, "Aucun match trouvé pour aujourd'hui.");
    assert.deepEqual(embed.fields, []);
  });

  it('only the games with matches get a field, in the usual game order', () => {
    const matches = [makeMatch({ game: 'valorant' }), makeMatch({ game: 'leagueoflegends' })];
    const embed = first(buildPayload(matches, [], DAY).embeds);

    assert.deepEqual(
      embed.fields.map((field) => field.name),
      ['League of Legends', 'Valorant'],
    );
  });

  it('pages that failed to load are listed on top, and the matches found still show', () => {
    const failures = ['Karmine_Corp (valorant)', 'Karmine_Corp_GC (valorant)'];
    const embed = first(buildPayload([makeMatch()], failures, DAY).embeds);

    assert.match(embed.description ?? '', /⚠️ .*Karmine_Corp \(valorant\), Karmine_Corp_GC/);
    assert.match(first(embed.fields).value, /🕙 20:30\n⚔️ Karmine Corp vs G2 Esports/);
  });

  it('a game with 10 matches is cut to stay under the Discord limit of 1024 characters', () => {
    const matches = Array.from({ length: 10 }, () => makeMatch());
    const lol = first(first(buildPayload(matches, [], DAY).embeds).fields);

    assert.ok(lol.value.length <= 1024);
    assert.ok(lol.value.endsWith('\n…'));
  });
});
