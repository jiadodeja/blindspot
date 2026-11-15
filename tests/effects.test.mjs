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
  const quickFixCalls = [];
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
  const handler = await load('src/content/effects/index.ts');
  const quickFix = new vm.SyntheticModule(['handleQuickFix'], function () {
    this.setExport('handleQuickFix', message => {
      quickFixCalls.push(message.type);
      return ['SCAN_PAGE', 'HIGHLIGHT_ISSUE', 'PREVIEW_FIX', 'UNDO_PREVIEW'].includes(message.type);
    });
  }, { context });
  const entry = await load('src/content/index.ts');
  await entry.link(specifier => {
    if (['../shared/messages', '../../shared/messages'].includes(specifier)) return shared;
    if (specifier === './manager') return manager;
    if (specifier === './effects') return handler;
    if (specifier === './quickfix') return quickFix;
    if (mocks.has(specifier)) return mocks.get(specifier);
    throw new Error(`Unexpected import: ${specifier}`);
  });
  await entry.evaluate();
  return {
    calls,
    quickFixCalls,
    route(message) {
      const replies = [];
      const result = listener(message, {}, reply => replies.push(structuredClone(reply)));
      return { result, replies };
    },
    manager: manager.namespace,
    defaults: structuredClone(shared.namespace.defaultEffects),
    failOn(name) { failingFunction = name; },
    send(message) {
      const replies = [];
      const result = handler.namespace.handleEffects(message, reply => replies.push(structuredClone(reply)));
      const isEffect = ['APPLY_EFFECTS', 'RESET_EFFECTS', 'GET_EFFECTS'].includes(message.type);
      assert.equal(result, isEffect, 'handler reports whether it handled the message');
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

test('shared router sends Simulate messages only to effects and keeps Quick Fix routing', async () => {
  const h = await harness();
  const settings = configured(h.defaults);
  settings.blur.on = true;
  assert.deepEqual(h.route({ type: 'APPLY_EFFECTS', settings }), {
    result: true, replies: [{ ok: true, type: 'DONE' }],
  });
  assert.deepEqual(h.route({ type: 'GET_EFFECTS' }), {
    result: true, replies: [{ ok: true, type: 'EFFECTS', settings }],
  });
  assert.deepEqual(h.quickFixCalls, [], 'Simulate messages must not reach Quick Fix');
  assert.deepEqual(h.route({ type: 'SCAN_PAGE' }), { result: true, replies: [] });
  assert.deepEqual(h.quickFixCalls, ['SCAN_PAGE'], 'async Quick Fix keeps its response channel open');
  assert.deepEqual(h.route({ type: 'GET_ELEMENT_RECT', issueId: 'example' }), { result: false, replies: [] });
});
