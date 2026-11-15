import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

// A small node-identity fixture: test restoration and exclusions without a browser.
class TextNode {
  constructor(data) { this.data = data; this.parentNode = null; }
  get parentElement() { return this.parentNode; }
  get textContent() { return this.data; }
  replaceWith(node) {
    const parent = this.parentNode;
    if (!parent) return;
    const index = parent.children.indexOf(this);
    parent.children[index] = node;
    node.parentNode = parent;
    this.parentNode = null;
  }
}
class Element extends TextNode {
  constructor(tag) { super(''); this.tag = tag; this.children = []; this.attrs = new Map(); this.style = { setProperty(name, value) { this[name] = value; } }; this.visible = true; }
  get textContent() { return this.children.map(node => node.textContent).join(''); }
  set textContent(text) { this.children.forEach(node => { node.parentNode = null; }); this.children = []; this.appendChild(new TextNode(text)); }
  appendChild(node) { this.children.push(node); node.parentNode = this; return node; }
  setAttribute(name, value) { this.attrs.set(name, value); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  removeAttribute(name) { this.attrs.delete(name); }
  get isConnected() { return this.tag === 'html' || Boolean(this.parentNode?.isConnected); }
  getClientRects() { return this.visible ? [{}] : []; }
  closest(selector) {
    if (selector === 'p, li, blockquote, h1, h2, h3, h4, h5, h6') {
      return ['p', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(this.tag) ? this : this.parentNode?.closest(selector) ?? null;
    }
    const tagMatch = selector.split(',').some(part => part.trim() === this.tag);
    const protectedAttr = ['data-blindspot', 'data-blindspot-reading', 'contenteditable', 'hidden', 'aria-hidden'].some(name => this.attrs.has(name));
    return tagMatch || protectedAttr ? this : this.parentNode?.closest(selector) ?? null;
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
    this.parentNode = null;
  }
}
function texts(node) { return node instanceof Element ? node.children.flatMap(texts) : [node]; }
function elements(node) { return node instanceof Element ? [node, ...node.children.flatMap(elements)] : []; }
async function fixture() {
  const observers = [];
  const timers = new Map();
  let timerId = 0;
  class Observer {
    constructor(callback) { this.callback = callback; this.active = false; observers.push(this); }
    observe() { this.active = true; }
    disconnect() { this.active = false; }
  }
  const root = new Element('html');
  const body = root.appendChild(new Element('body'));
  const document = {
    body, documentElement: root,
    createElement: tag => new Element(tag),
    createTextNode: text => new TextNode(text),
    createTreeWalker(node) { const nodes = texts(node); return { nextNode: () => nodes.shift() ?? null }; },
  };
  const math = Object.create(Math);
  math.random = () => 0; // Make letter selection deterministic.
  const context = vm.createContext({ document, MutationObserver: Observer,
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    NodeFilter: { SHOW_TEXT: 4 }, Math: math,
    getComputedStyle: () => ({ visibility: 'visible' }),
  });
  const source = await readFile(new URL('../src/content/effects/dyslexia.ts', import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source), { context });
  await module.link(() => { throw new Error('Unexpected runtime dependency'); });
  await module.evaluate();
  return {
    root, body, effect: module.namespace,
    notifyMutation() { for (const observer of observers) if (observer.active) observer.callback([]); },
    flushTimers() { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()); },
    observers,
  };
}
const settings = { on: true, letterSpacingEm: -0.04, wordSpacingEm: -0.12, lineHeight: 1.1, openDyslexicFont: false };

test('visual stress preserves readable text, avoids nested wrapping, and restores node identity', async () => {
  const { body, root, effect } = await fixture();
  const p = body.appendChild(new Element('p'));
  const original = p.appendChild(new TextNode('Reading caf\u00e9 and \u{1F469}\u200d\u{1F4BB} text.'));
  effect.enableDyslexia(settings);
  assert.equal(p.textContent, original.data);
  const wrapper = p.children[0];
  assert.equal(wrapper.getAttribute('data-blindspot-reading'), '');
  assert.equal(p.getAttribute('data-blindspot-reading-block'), 'active');
  const beforeCount = elements(root).length;
  effect.enableDyslexia({ ...settings, lineHeight: 1.2 });
  assert.equal(elements(root).length, beforeCount);
  assert.equal(p.children[0], wrapper);
  const style = root.children.find(node => node.tag === 'style');
  assert.match(style.textContent, /prefers-reduced-motion: reduce/);
  assert.match(style.textContent, /animation: none !important/);
  effect.disableDyslexia();
  effect.disableDyslexia();
  assert.equal(p.children[0], original);
  assert.equal(p.getAttribute('data-blindspot-reading-block'), null);
  assert.equal(root.children.some(node => node.tag === 'style'), false);
});

test('visual stress skips editable, hidden, script, and owned content', async () => {
  const { body, effect } = await fixture();
  const protectedNodes = [];
  for (const tag of ['input', 'textarea', 'select', 'script', 'style', 'svg']) {
    const element = body.appendChild(new Element(tag));
    protectedNodes.push(element.appendChild(new TextNode('Protected text')));
  }
  for (const attr of ['contenteditable', 'data-blindspot', 'hidden']) {
    const element = body.appendChild(new Element('div'));
    element.setAttribute(attr, 'true');
    protectedNodes.push(element.appendChild(new TextNode('Protected text')));
  }
  const invisible = body.appendChild(new Element('p'));
  invisible.visible = false;
  protectedNodes.push(invisible.appendChild(new TextNode('Invisible text')));
  const originalParents = protectedNodes.map(node => node.parentNode);
  effect.enableDyslexia(settings);
  protectedNodes.forEach((node, index) => assert.equal(node.parentNode, originalParents[index]));
  effect.disableDyslexia();
});

test('cleanup retains page edits and never re-inserts content the page removed', async () => {
  const { body, effect } = await fixture();
  const p = body.appendChild(new Element('p'));
  const original = p.appendChild(new TextNode('Original text'));
  effect.enableDyslexia(settings);
  p.children[0].textContent = 'Updated by the page';
  effect.disableDyslexia();
  assert.equal(p.children[0], original);
  assert.equal(original.data, 'Updated by the page');
  effect.enableDyslexia(settings);
  original.data = 'Updated through original node';
  effect.disableDyslexia();
  assert.equal(p.textContent, 'Updated through original node');
  effect.enableDyslexia(settings);
  p.children[0].remove();
  effect.disableDyslexia();
  assert.equal(p.children.length, 0);
});

test('letter wrappers are bounded on long pages', async () => {
  const { body, root, effect } = await fixture();
  body.appendChild(new Element('p')).appendChild(new TextNode('a'.repeat(1000)));
  effect.enableDyslexia(settings);
  assert.equal(elements(root).filter(node => node.attrs.has('data-blindspot-reading-letter')).length, 12);
  effect.disableDyslexia();
});

test('buttons, links, labels, code, and focusable text receive flipping letters', async () => {
  const { body, root, effect } = await fixture();
  const targets = ['button', 'a', 'label', 'code', 'pre', 'div'].map(tag => {
    const element = body.appendChild(new Element(tag));
    if (tag === 'div') element.setAttribute('tabindex', '0');
    element.appendChild(new TextNode('Read me'));
    return element;
  });
  effect.enableDyslexia(settings);
  for (const element of targets) {
    assert.equal(element.children[0].getAttribute('data-blindspot-reading'), '');
    assert.ok(elements(element).some(node => node.getAttribute('data-blindspot-reading-letter') === 'flip'));
    assert.equal(element.textContent, 'Read me');
  }
  const style = root.children.find(node => node.tag === 'style');
  assert.match(style.textContent, /rotateY\(180deg\)/);
  assert.match(style.textContent, /scaleX\(-1\)/, 'reduced motion retains static mirrored letters');
  effect.disableDyslexia();
});

test('animation is distributed across the page, including beyond the old text-node cutoff', async () => {
  const { body, effect } = await fixture();
  const paragraphs = [];
  for (let index = 0; index < 450; index++) {
    const p = body.appendChild(new Element('p'));
    p.appendChild(new TextNode('Page text'));
    paragraphs.push(p);
  }
  effect.enableDyslexia(settings);
  for (const p of paragraphs) {
    assert.ok(elements(p).some(node => node.attrs.has('data-blindspot-reading-letter')));
  }
  effect.disableDyslexia();
  paragraphs.forEach(p => assert.equal(p.children[0] instanceof TextNode && !(p.children[0] instanceof Element), true));
});

test('new or revealed content is processed and cleanup cancels pending observer work', async () => {
  const h = await fixture();
  const hidden = h.body.appendChild(new Element('p'));
  hidden.visible = false;
  hidden.appendChild(new TextNode('Hidden at first'));
  h.effect.enableDyslexia(settings);
  const button = h.body.appendChild(new Element('button'));
  button.appendChild(new TextNode('New button'));
  hidden.visible = true;
  h.notifyMutation();
  h.notifyMutation();
  h.flushTimers();
  assert.ok(elements(button).some(node => node.attrs.has('data-blindspot-reading-letter')));
  assert.ok(elements(hidden).some(node => node.attrs.has('data-blindspot-reading-letter')));
  h.notifyMutation();
  h.effect.disableDyslexia();
  h.flushTimers();
  assert.ok(h.observers.every(observer => !observer.active));
  assert.equal(button.children[0] instanceof Element, false);
  assert.equal(button.textContent, 'New button');
});
