import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

describe('index: checks the environment before any request', () => {
  it('an invalid TARGET_DATE stops the run at once, with the expected format', () => {
    const run = spawnSync(process.execPath, ['src/index.ts'], {
      env: {
        PATH: process.env.PATH,
        LIQUIPEDIA_USER_AGENT: 'test',
        DRY_RUN: '1',
        TARGET_DATE: 'nimporte quoi',
      },
      encoding: 'utf8',
      timeout: 5_000,
    });

    assert.equal(run.status, 1);
    assert.match(run.stderr, /TARGET_DATE invalide : nimporte quoi/);
  });
});
