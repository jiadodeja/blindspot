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

// Test the real manager and handlers with effect spies or real filter modules.
// The small DOM fixture models stylesheet ownership; visual QA still runs in Chrome.
async function harness({ realFilters = false, realKeyboard = false } = {}) {
  const calls = [];
  const quickFixCalls = [];
  let listener;
  let failingFunction;
  const styles = [];
  const pageListeners = new Map();
  const documentElement = {
    style: { filter: 'sepia(25%)' },
    appendChild(node) { node.isConnected = true; styles.push(node); return node; },
  };
  const document = {
    documentElement,
    addEventListener(type, handler, options) {
      assert.equal(options.capture, true);
      assert.equal(options.passive, false);
      const handlers = pageListeners.get(type) ?? new Set();
      handlers.add(handler);
      pageListeners.set(type, handlers);
    },
    removeEventListener(type, handler) { pageListeners.get(type)?.delete(handler); },
    dispatchInput(type, detail = 1) {
      const event = {
        type, detail, defaultPrevented: false, stopped: false,
        preventDefault() { this.defaultPrevented = true; },
        stopImmediatePropagation() { this.stopped = true; },
      };
      for (const handler of pageListeners.get(type) ?? []) handler(event);
      return event;
    },
    createElement(tag) {
      assert.equal(tag, 'style');
      return {
        textContent: '',
        isConnected: false,
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        remove() {
          const index = styles.indexOf(this);
          if (index !== -1) styles.splice(index, 1);
          this.isConnected = false;
        },
      };
    },
  };
  const context = vm.createContext({
    structuredClone,
    document,
    chrome: { runtime: { onMessage: { addListener(fn) { listener = fn; } } } },
  });
  const effectError = vm.runInContext('new Error("Effect failed")', context);
  const mocks = new Map(effects.map(([, label, file]) => {
    const names = [`enable${label}`, `disable${label}`];
    const getter = ['Blur', 'Grayscale'].includes(label) ? `get${label}` : null;
    let value = 0;
    const mock = new vm.SyntheticModule(getter ? [...names, getter] : names, function () {
      if (getter) this.setExport(getter, () => value);
      for (const name of names) {
        this.setExport(name, (...args) => {
          calls.push([name, ...structuredClone(args)]);
          if (name === failingFunction) throw effectError;
          if (getter) value = name.startsWith('disable') ? 0 : label === 'Blur' ? args[0] : 100;
        });
      }
    }, { context });
    return [`./${file}`, mock];
  }));
  async function load(path) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
    return new vm.SourceTextModule(stripTypeScriptTypes(source), { context, identifier: path });
  }
  if (realFilters) {
    mocks.set('./blur', await load('src/content/effects/blur.ts'));
    mocks.set('./grayscale', await load('src/content/effects/grayscale.ts'));
  }
  if (realKeyboard) mocks.set('./keyboard', await load('src/content/effects/keyboard.ts'));
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
    styles,
    document,
    blur: mocks.get('./blur').namespace,
    grayscale: mocks.get('./grayscale').namespace,
    keyboard: mocks.get('./keyboard').namespace,
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

test('real filter modules store independent values without touching the DOM', async () => {
  const h = await harness({ realFilters: true });
  h.blur.enableBlur(4);
  h.grayscale.enableGrayscale();
  assert.equal(h.blur.getBlur(), 4);
  assert.equal(h.grayscale.getGrayscale(), 100);
  h.blur.disableBlur();
  assert.equal(h.blur.getBlur(), 0);
  assert.equal(h.grayscale.getGrayscale(), 100);
  h.blur.enableBlur(6);
  h.grayscale.disableGrayscale();
  assert.equal(h.blur.getBlur(), 6);
  assert.equal(h.grayscale.getGrayscale(), 0);
  assert.equal(h.styles.length, 0);
});

test('real blur values stay in range and never interpolate invalid CSS', async () => {
  const h = await harness({ realFilters: true });
  for (const [input, expected] of [[-1, 2], [2, 2], [10, 10], [30, 10], [NaN, 0], [Infinity, 0]]) {
    h.blur.enableBlur(input);
    assert.equal(h.blur.getBlur(), expected);
  }
});

test('real filters compose, update one owned stylesheet, and remove it when both are off', async () => {
  const h = await harness({ realFilters: true });
  const settings = structuredClone(h.defaults);
  h.manager.applyEffects(settings);
  assert.equal(h.styles.length, 0, 'no zero-value filter rule on the original page');
  settings.blur = { on: true, blurPx: 4 };
  h.manager.applyEffects(settings);
  const [ownedStyle] = h.styles;
  assert.equal(ownedStyle.attributes['data-blindspot'], 'filters');
  assert.equal(ownedStyle.textContent, 'html { filter: blur(4px) grayscale(0%) !important; }');
  settings.grayscale.on = true;
  h.manager.applyEffects(settings);
  assert.equal(h.styles.length, 1);
  assert.equal(h.styles[0], ownedStyle, 'update the same stylesheet');
  assert.equal(ownedStyle.textContent, 'html { filter: blur(4px) grayscale(100%) !important; }');
  settings.blur.on = false;
  h.manager.applyEffects(settings);
  assert.equal(ownedStyle.textContent, 'html { filter: blur(0px) grayscale(100%) !important; }');
  settings.grayscale.on = false;
  h.manager.applyEffects(settings);
  assert.equal(h.styles.length, 0);
  assert.equal(ownedStyle.isConnected, false);
  assert.equal(h.document.documentElement.style.filter, 'sepia(25%)', 'page inline styles are untouched');
});

test('message reset removes only the owned stylesheet and supports enabling again', async () => {
  const h = await harness({ realFilters: true });
  const pageStyle = h.document.createElement('style');
  pageStyle.textContent = 'html { filter: sepia(25%); }';
  h.document.documentElement.appendChild(pageStyle);
  const settings = structuredClone(h.defaults);
  settings.blur = { on: true, blurPx: 8 };
  settings.grayscale.on = true;
  assert.deepEqual(h.send({ type: 'APPLY_EFFECTS', settings }), [{ ok: true, type: 'DONE' }]);
  assert.equal(h.styles.length, 2);
  h.send({ type: 'RESET_EFFECTS' });
  h.send({ type: 'RESET_EFFECTS' });
  assert.deepEqual(h.styles, [pageStyle]);
  assert.equal(pageStyle.textContent, 'html { filter: sepia(25%); }');
  assert.equal(h.blur.getBlur(), 0);
  assert.equal(h.grayscale.getGrayscale(), 0);
  assert.deepEqual(h.send({ type: 'GET_EFFECTS' })[0].settings, h.defaults);
  h.send({ type: 'APPLY_EFFECTS', settings });
  assert.equal(h.styles.length, 2);
  assert.equal(h.styles[1].textContent, 'html { filter: blur(8px) grayscale(100%) !important; }');
});

test('keyboard mode adds one owned focus rule and can be enabled repeatedly', async () => {
  const h = await harness({ realKeyboard: true });
  h.keyboard.enableKeyboard();
  h.keyboard.enableKeyboard();
  assert.equal(h.styles.length, 1);
  const [style] = h.styles;
  assert.equal(style.attributes['data-blindspot'], 'keyboard');
  assert.match(style.textContent, /:root :focus\s*\{/);
  assert.match(style.textContent, /outline: 3px solid #6d28d9 !important/);
  assert.match(style.textContent, /outline-offset: 3px !important/);
  assert.match(style.textContent, /box-shadow: 0 0 0 3px #fff !important/);
  // If the page replaces our stylesheet, re-enabling can recreate it.
  style.remove();
  h.keyboard.enableKeyboard();
  assert.equal(h.styles.length, 1);
  assert.notEqual(h.styles[0], style);
});

test('keyboard disable restores page styling and supports enable after reset', async () => {
  const h = await harness({ realKeyboard: true });
  const pageStyle = h.document.createElement('style');
  pageStyle.textContent = ':focus { outline: 1px solid blue; }';
  h.document.documentElement.appendChild(pageStyle);
  h.keyboard.disableKeyboard();
  h.keyboard.enableKeyboard();
  const ownedStyle = h.styles[1];
  h.keyboard.disableKeyboard();
  h.keyboard.disableKeyboard();
  assert.deepEqual(h.styles, [pageStyle]);
  assert.equal(ownedStyle.isConnected, false);
  assert.equal(pageStyle.textContent, ':focus { outline: 1px solid blue; }');
  h.keyboard.enableKeyboard();
  assert.equal(h.styles.length, 2);
});

test('keyboard messages coexist with filters and Reset removes both owned stylesheets', async () => {
  const h = await harness({ realFilters: true, realKeyboard: true });
  const settings = structuredClone(h.defaults);
  settings.keyboardOnly.on = true;
  settings.blur = { on: true, blurPx: 4 };
  settings.grayscale.on = true;
  assert.deepEqual(h.send({ type: 'APPLY_EFFECTS', settings }), [{ ok: true, type: 'DONE' }]);
  assert.equal(h.send({ type: 'GET_EFFECTS' })[0].settings.keyboardOnly.on, true);
  assert.deepEqual(h.styles.map(style => style.attributes['data-blindspot']), ['filters', 'keyboard']);
  const [filterStyle, keyboardStyle] = h.styles;
  settings.blur.blurPx = 6;
  h.send({ type: 'APPLY_EFFECTS', settings });
  assert.equal(h.styles.length, 2);
  assert.equal(h.styles[1], keyboardStyle);
  settings.keyboardOnly.on = false;
  h.send({ type: 'APPLY_EFFECTS', settings });
  assert.deepEqual(h.styles, [filterStyle]);
  assert.equal(filterStyle.textContent, 'html { filter: blur(6px) grayscale(100%) !important; }');
  settings.keyboardOnly.on = true;
  h.send({ type: 'APPLY_EFFECTS', settings });
  h.send({ type: 'RESET_EFFECTS' });
  assert.equal(h.styles.length, 0);
  assert.equal(h.send({ type: 'GET_EFFECTS' })[0].settings.keyboardOnly.on, false);
});

test('keyboard mode blocks pointer and wheel input but preserves keyboard activation and scrolling', async () => {
  const h = await harness({ realKeyboard: true });
  h.keyboard.enableKeyboard();
  for (const type of [
    'pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'mousemove',
    'click', 'dblclick', 'auxclick', 'contextmenu', 'wheel',
    'touchstart', 'touchmove', 'touchend', 'dragstart', 'drop',
  ]) {
    const event = h.document.dispatchInput(type);
    assert.equal(event.defaultPrevented, true, `${type} default action blocked`);
    assert.equal(event.stopped, true, `${type} page handlers blocked`);
  }
  for (const type of ['keydown', 'keyup', 'scroll']) {
    const event = h.document.dispatchInput(type);
    assert.equal(event.defaultPrevented, false, `${type} preserved`);
    assert.equal(event.stopped, false);
  }
  const keyboardClick = h.document.dispatchInput('click', 0);
  assert.equal(keyboardClick.defaultPrevented, false, 'Enter/Space activation preserved');
  assert.equal(keyboardClick.stopped, false);
});

test('toggle-off and Reset restore mouse and wheel interaction', async () => {
  const h = await harness({ realKeyboard: true });
  for (const reset of [false, true]) {
    h.keyboard.enableKeyboard();
    h.keyboard.enableKeyboard();
    assert.equal(h.document.dispatchInput('wheel').defaultPrevented, true);
    if (reset) h.send({ type: 'RESET_EFFECTS' });
    else h.keyboard.disableKeyboard();
    for (const type of ['click', 'wheel', 'pointerdown', 'touchmove']) {
      const event = h.document.dispatchInput(type);
      assert.equal(event.defaultPrevented, false, `${type} restored`);
      assert.equal(event.stopped, false);
    }
  }
});
