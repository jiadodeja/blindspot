// Person B: show a fix on the live page, and undo it.

// The scan only sends the first 1500 characters of an element to the AI.
// If an element is bigger than that, the AI only saw part of it, so we must not swap it out.
// For big elements we only copy the attributes (aria-label, alt, style...) onto the real element.
const MAX_HTML = 1500

type Saved =
  | { kind: 'swap'; original: Element; current: Element } // we replaced the element
  | { kind: 'attrs'; el: Element; before: Record<string, string> } // we only changed attributes

const previews = new Map<string, Saved>()

function findElement(id: string): Element | null {
  return document.querySelector(`[data-aq-id="${id}"]`)
}

// Make the glowing outline so the developer sees where the change is
export function flash(el: Element) {
  const box = el as HTMLElement
  box.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const oldOutline = box.style.outline
  const oldOffset = box.style.outlineOffset
  box.style.outline = '3px solid #f59e0b'
  box.style.outlineOffset = '2px'
  setTimeout(() => {
    box.style.outline = oldOutline
    box.style.outlineOffset = oldOffset
  }, 1500)
}

export function highlight(id: string): string | null {
  const el = findElement(id)
  if (!el) return 'Could not find that element. Scan again.'
  flash(el)
  return null
}

// The AI is told not to add scripts, but we remove them anyway to be safe.
function cleanUp(root: Element) {
  root.querySelectorAll('script').forEach((s) => s.remove())
  const all = [root, ...Array.from(root.querySelectorAll('*'))]
  for (const el of all) {
    for (const attr of Array.from(el.attributes)) {
      const bad = attr.name.startsWith('on') || attr.value.trim().toLowerCase().startsWith('javascript:')
      if (bad) el.removeAttribute(attr.name)
    }
  }
}

function snapshot(el: Element): Record<string, string> {
  const out: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) out[attr.name] = attr.value
  return out
}

// returns an error text, or null when it worked
export function previewFix(id: string, fixedHtml: string): string | null {
  const saved = previews.get(id)
  const target = saved ? (saved.kind === 'swap' ? saved.current : saved.el) : findElement(id)
  if (!target) return 'Could not find that element. Scan again.'

  const template = document.createElement('template')
  template.innerHTML = fixedHtml.trim()
  const fixed = template.content.firstElementChild
  if (!fixed) return 'The fixed code did not have an element in it.'
  cleanUp(fixed)
  fixed.setAttribute('data-aq-id', id)

  const bigElement = saved ? saved.kind === 'attrs' : target.outerHTML.length > MAX_HTML

  if (bigElement) {
    // only copy attributes onto the real element. Its children stay exactly as they were.
    const el = saved && saved.kind === 'attrs' ? saved.el : target
    const before = saved && saved.kind === 'attrs' ? saved.before : snapshot(el)
    for (const attr of Array.from(fixed.attributes)) el.setAttribute(attr.name, attr.value)
    previews.set(id, { kind: 'attrs', el, before })
    flash(el)
    return null
  }

  // small element: swap the whole thing
  const original = saved && saved.kind === 'swap' ? saved.original : target
  target.replaceWith(fixed)
  previews.set(id, { kind: 'swap', original, current: fixed })
  flash(fixed)
  return null
}

export function undoPreview(id: string): string | null {
  const saved = previews.get(id)
  if (!saved) return 'Nothing to undo for this one.'
  if (saved.kind === 'swap') {
    saved.current.replaceWith(saved.original)
    flash(saved.original)
  } else {
    // put every attribute back the way it was
    for (const attr of Array.from(saved.el.attributes)) {
      if (!(attr.name in saved.before)) saved.el.removeAttribute(attr.name)
    }
    for (const [name, value] of Object.entries(saved.before)) saved.el.setAttribute(name, value)
    flash(saved.el)
  }
  previews.delete(id)
  return null
}
