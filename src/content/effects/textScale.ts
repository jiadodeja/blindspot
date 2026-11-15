// Text scaling: make the text on the page bigger (100 to 200 percent).
// We change the font size of each element that has text.
// We save the old inline font size of each one, so Reset can put it back.

type Saved = { value: string; priority: string }

const saved = new Map<HTMLElement, Saved>()
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'])

// True if the element has some text of its own (not just text inside its children).
function hasOwnText(el: HTMLElement): boolean {
  return Array.from(el.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
  )
}

function isFormField(el: HTMLElement): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  )
}

// Put every font size back the way it was.
function restoreSizes(): void {
  saved.forEach((old, el) => {
    if (old.value) {
      el.style.setProperty('font-size', old.value, old.priority)
    } else {
      el.style.removeProperty('font-size')
    }
  })
  saved.clear()
}

export function enableTextScale(percent: number): void {
  // Start from the real sizes each time, so moving the slider does not stack up.
  restoreSizes()
  if (percent === 100) return

  const scale = percent / 100
  const targets = Array.from(document.body.querySelectorAll<HTMLElement>('*')).filter(
    (el) =>
      el.style !== undefined &&
      !SKIP_TAGS.has(el.tagName) &&
      !el.closest('[data-blindspot]') &&
      (hasOwnText(el) || isFormField(el)),
  )

  // Step 1: read all the sizes first. Step 2: write them.
  // If we mixed reading and writing, a parent change could change what the child reads.
  const sizes = targets.map((el) => parseFloat(getComputedStyle(el).fontSize))

  targets.forEach((el, i) => {
    const size = sizes[i]
    if (!Number.isFinite(size)) return
    saved.set(el, {
      value: el.style.getPropertyValue('font-size'),
      priority: el.style.getPropertyPriority('font-size'),
    })
    el.style.setProperty('font-size', `${size * scale}px`, 'important')
  })
}

export function disableTextScale(): void {
  restoreSizes()
}
