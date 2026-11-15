import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const effects = [
  ['blur', 'Blur', 'blur'],
  ['grayscale', 'Grayscale', 'grayscale'],
  ['tunnelVision', 'Tunnel', 'tunnel'],
  ['dyslexia', 'Dyslexia', 'dyslexia'],
  ['textScale', 'TextScale', 'textScale'],
  ['keyboardOnly', 'Keyboard', 'keyboard'],
  ['screenReader', 'ScreenReader', 'screenReader'],
];

// Load the real manager and listener; replace only effect bodies with spies.
// No browser or test dependency is required while effects are TODO stubs.
async function harness() {
  const calls = [];
  let listener;
  let failingFunction;
  const context = vm.createContext({
    structuredClone,
    chrome: { runtime: { onMessage: { addListener(fn) { listener = fn; } } } },
  });
  const effectError = vm.runInContext('new Error("Effect failed")', context);
  const mocks = new Map(effects.map(([, label, file]) => {
    const names = [`enable${label}`, `disable${label}`];
    const mock = new vm.SyntheticModule(names, function () {
      for (const name of names) {
        this.setExport(name, (...args) => {
          calls.push([name, ...structuredClone(args)]);
          if (name === failingFunction) throw effectError;
        });
      }
    }, { context });
    return [`./${file}`, mock];
  }));
  async function load(path) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    return new vm.SourceTextModule(stripTypeScriptTypes(source), { context, identifier: path });
  }
  const shared = await load('src/shared/messages.ts');
  const manager = await load('src/content/effects/manager.ts');
  const entry = await load('src/content/index.ts');
  await entry.link(specifier => {
    if (specifier === '../shared/messages') return shared;
    if (specifier === './effects/manager') return manager;
    if (mocks.has(specifier)) return mocks.get(specifier);
    throw new Error(`Unexpected import: ${specifier}`);
  });
  await entry.evaluate();
  return {
    calls,
    manager: manager.namespace,
    defaults: structuredClone(shared.namespace.defaultEffects),
    failOn(name) { failingFunction = name; },
    send(message) {
      const replies = [];
      const result = listener(message, {}, reply => replies.push(structuredClone(reply)));
      assert.equal(result, false, 'messages are answered synchronously');
      return replies;
    },
  };
}

function configured(defaults) {
  const settings = structuredClone(defaults);
  settings.blur.blurPx = 6;
  settings.tunnelVision.radiusPx = 140;
  settings.dyslexia.letterSpacingEm = 0.2;
  settings.dyslexia.wordSpacingEm = 0.4;
  settings.dyslexia.lineHeight = 2;
  settings.dyslexia.openDyslexicFont = true;
  settings.textScale.percent = 175;
  return settings;
}

function expectedCalls(settings) {
  const parameters = {
    blur: [settings.blur.blurPx],
    tunnelVision: [settings.tunnelVision.radiusPx],
    dyslexia: [settings.dyslexia],
    textScale: [settings.textScale.percent],
  };
  return effects.map(([key, label]) => settings[key].on
    ? [`enable${label}`, ...(parameters[key] ?? [])]
    : [`disable${label}`]);
}

test('manager dispatches all 128 toggle combinations with correct parameters', async () => {
  const h = await harness();
  for (let mask = 0; mask < 128; mask++) {
    const settings = configured(h.defaults);
    effects.forEach(([key], index) => { settings[key].on = Boolean(mask & (1 << index)); });
    const before = structuredClone(settings);
    h.calls.length = 0;
    h.manager.applyEffects(settings);
    assert.deepEqual(h.calls, expectedCalls(settings), `combination ${mask}`);
    assert.deepEqual(settings, before, 'dispatch must not change supplied settings');
  }
});

test('reset disables all seven effects', async () => {
  const h = await harness();
  h.manager.resetEffects();
  assert.deepEqual(h.calls, effects.map(([, label]) => [`disable${label}`]));
});

test('messages apply settings and keep stored and returned state isolated', async () => {
  const h = await harness();
  assert.deepEqual(h.send({ type: 'GET_EFFECTS' }), [
    { ok: true, type: 'EFFECTS', settings: h.defaults },
  ]);
  const settings = configured(h.defaults);
  settings.blur.on = true;
  settings.grayscale.on = true;
  const expected = structuredClone(settings);
  assert.deepEqual(h.send({ type: 'APPLY_EFFECTS', settings }), [{ ok: true, type: 'DONE' }]);
  assert.deepEqual(h.calls, expectedCalls(expected));
  settings.blur.blurPx = 10;
  const [reply] = h.send({ type: 'GET_EFFECTS' });
  assert.deepEqual(reply.settings, expected, 'stored settings are cloned from the request');
  reply.settings.grayscale.on = false;
  assert.deepEqual(h.send({ type: 'GET_EFFECTS' })[0].settings, expected, 'replies cannot mutate stored state');

  const updated = structuredClone(expected);
  updated.blur.on = false;
  h.send({ type: 'APPLY_EFFECTS', settings: updated });
  assert.deepEqual(h.send({ type: 'GET_EFFECTS' })[0].settings, updated);
  assert.equal(updated.grayscale.on, true, 'disabling blur leaves grayscale enabled');
});

test('RESET_EFFECTS clears effects and restores independent default settings', async () => {
  const h = await harness();
  const settings = configured(h.defaults);
  for (const [key] of effects) settings[key].on = true;
  h.send({ type: 'APPLY_EFFECTS', settings });
  h.calls.length = 0;
  assert.deepEqual(h.send({ type: 'RESET_EFFECTS' }), [{ ok: true, type: 'DONE' }]);
  assert.deepEqual(h.calls, effects.map(([, label]) => [`disable${label}`]));
  assert.deepEqual(h.send({ type: 'GET_EFFECTS' })[0].settings, h.defaults);
});

test('effect errors produce an error reply without saving failed settings', async () => {
  const h = await harness();
  h.failOn('enableBlur');
  const settings = configured(h.defaults);
  settings.blur.on = true;
  assert.deepEqual(h.send({ type: 'APPLY_EFFECTS', settings }), [{ ok: false, error: 'Effect failed' }]);
  assert.deepEqual(h.send({ type: 'GET_EFFECTS' })[0].settings, h.defaults);
});

test('Quick Fix messages are left unanswered for its own handler', async () => {
  const h = await harness();
  for (const message of [
    { type: 'SCAN_PAGE' },
    { type: 'HIGHLIGHT_ISSUE', issueId: 'example' },
    { type: 'PREVIEW_FIX', issueId: 'example', fixedHtml: '<button>OK</button>' },
    { type: 'UNDO_PREVIEW', issueId: 'example' },
    { type: 'GET_ELEMENT_RECT', issueId: 'example' },
  ]) assert.deepEqual(h.send(message), []);
  assert.deepEqual(h.calls, []);
});
