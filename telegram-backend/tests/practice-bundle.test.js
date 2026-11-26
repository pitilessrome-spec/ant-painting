'use strict';
// Practice mode must play the same rules as the server: the committed browser bundle
// has to match a fresh build of telegram-backend/lib.
const test = require('node:test'), assert = require('node:assert/strict');
const { readFileSync } = require('node:fs'), { join } = require('node:path'), vm = require('node:vm');
const root = join(__dirname, '..', '..');

test('js/raid-practice-engine.js is up to date with the server engine', async () => {
  const { build } = await import(require('node:url').pathToFileURL(join(root, 'tools', 'build-raid-practice.mjs')).href);
  const committed = readFileSync(join(root, 'js', 'raid-practice-engine.js'), 'utf8');
  assert.equal(committed, build(), 'run: node tools/build-raid-practice.mjs');
});

test('the browser bundle runs a V7 fight on its own', () => {
  const src = readFileSync(join(root, 'js', 'raid-practice-engine.js'), 'utf8');
  const sandbox = { window: {}, crypto: require('node:crypto').webcrypto };
  vm.runInNewContext(src, sandbox);
  const { engine: R } = sandbox.window.AntRaidPractice;
  const s = R.createRoom('small', 'beetle', 'me', 0);
  assert.equal(s.rulesVersion, 7);
  R.start(s, 'me', 1000);
  const rage = s.nextRageAt;
  R.advance(s, rage);
  const v = R.view(s, 'me', rage);
  assert.equal(v.mechanic.type, 'spots');
  assert.equal(v.bossNameEn, 'Giant Ladybug');
  const r = R.act(s, 'me', { seq: 1, kind: 'color', color: v.me.available.find(c => c !== v.me.blocked) ?? v.me.available[0] }, rage + 1000);
  assert.ok(r.damage > 0);
});
