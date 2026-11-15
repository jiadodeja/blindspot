import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

async function loadSender(tabs) {
  const context = vm.createContext({ chrome: { tabs }, setTimeout, clearTimeout });
  const source = await readFile(new URL('../src/sidepanel/sendToPage.ts', import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source), { context });
  await module.link(() => { throw new Error('Unexpected runtime import'); });
  await module.evaluate();
  return module.namespace.sendToPage;
}

const message = { type: 'GET_EFFECTS' };
const never = () => new Promise(() => {});

test('a stalled tab query returns an error instead of keeping Simulate disabled', async () => {
  const send = await loadSender({ query: never });
  const result = await send(message, 10);
  assert.equal(result.ok, false);
  assert.match(result.error, /did not respond/);
});

test('a stalled content-script reply returns an error instead of keeping Simulate disabled', async () => {
  const send = await loadSender({ query: async () => [{ id: 12 }], sendMessage: never });
  const result = await send(message, 10);
  assert.equal(result.ok, false);
  assert.match(result.error, /refresh the web page/);
});

test('valid replies pass through with the active tab and full message', async () => {
  const expected = { ok: true, type: 'EFFECTS', settings: { blur: { on: false, blurPx: 4 } } };
  const send = await loadSender({
    query: async options => {
      assert.deepEqual(structuredClone(options), { active: true, currentWindow: true });
      return [{ id: 12 }];
    },
    sendMessage: async (tabId, sent) => {
      assert.equal(tabId, 12);
      assert.equal(sent, message);
      return expected;
    },
  });
  assert.equal(await send(message, 1000), expected);
});

test('missing content scripts, empty replies, and query failures yield friendly errors', async () => {
  for (const tabs of [
    { query: async () => { throw new Error('Unavailable'); } },
    { query: async () => [] },
    { query: async () => [{ id: 12 }], sendMessage: async () => { throw new Error('No receiver'); } },
    { query: async () => [{ id: 12 }], sendMessage: async () => undefined },
    { query: async () => [{ id: 12 }], sendMessage: async () => ({}) },
  ]) {
    const send = await loadSender(tabs);
    const result = await send(message, 1000);
    assert.equal(result.ok, false);
    assert.equal(typeof result.error, 'string');
    assert.notEqual(result.error, '');
  }
});

test('a late reply after timeout does not replace the connection error', async () => {
  let answer;
  const send = await loadSender({
    query: async () => [{ id: 12 }],
    sendMessage: () => new Promise(resolve => { answer = resolve; }),
  });
  const result = await send(message, 10);
  answer({ ok: true, type: 'EFFECTS', settings: {} });
  await Promise.resolve();
  assert.equal(result.ok, false);
});

test('Quick Fix can still wait for a long scan without a Simulate timeout', async () => {
  const expected = { ok: true, type: 'SCAN_RESULT', issues: [] };
  const send = await loadSender({
    query: async () => [{ id: 12 }],
    sendMessage: () => new Promise(resolve => setTimeout(() => resolve(expected), 20)),
  });
  assert.equal(await send({ type: 'SCAN_PAGE' }), expected);
});
