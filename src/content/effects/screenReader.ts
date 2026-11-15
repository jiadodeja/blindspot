// Screen reader mode: cover the page with black and read each focused thing out loud.
// Press Tab to move around. If something has no name, it says "no name".
// That is what a blind person hears on a page with missing labels.
// The mouse is blocked on purpose, because a screen reader user does not use it.

let overlay: HTMLDivElement | null = null
let caption: HTMLDivElement | null = null

const ROLES: Record<string, string> = {
  A: 'link',
  BUTTON: 'button',
  IMG: 'image',
  SELECT: 'dropdown',
  TEXTAREA: 'text field',
  H1: 'heading',
  H2: 'heading',
  H3: 'heading',
  H4: 'heading',
  H5: 'heading',
  H6: 'heading',
}

function getRole(el: Element): string {
  const explicit = el.getAttribute('role')
  if (explicit) return explicit
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox') return 'checkbox'
    if (el.type === 'radio') return 'radio button'
    if (el.type === 'submit' || el.type === 'button') return 'button'
    return 'text field'
  }
  return ROLES[el.tagName] ?? el.tagName.toLowerCase()
}

// Work out the name a screen reader would use. Empty string means no name.
function getName(el: Element): string {
  const label = el.getAttribute('aria-label')
  if (label && label.trim()) return label.trim()

  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const text = labelledBy
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim()
    if (text) return text
  }

  if (el instanceof HTMLImageElement) return el.alt.trim()

  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    const labelText = (el.labels?.item(0)?.textContent ?? '').trim()
    if (labelText) return labelText
    if (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'button') && el.value) {
      return el.value
    }
    if (!(el instanceof HTMLSelectElement) && el.placeholder) return el.placeholder
  }

  const text = ((el as HTMLElement).innerText ?? el.textContent ?? '').trim()
  if (text) return text.slice(0, 100)

  // A link or button with only a picture inside uses the picture's alt text.
  const img = el.querySelector('img')
  if (img && img.alt.trim()) return img.alt.trim()

  return el.getAttribute('title')?.trim() ?? ''
}

// Show the words on the black screen and say them out loud.
function say(words: string): void {
  if (caption) caption.textContent = words
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(new SpeechSynthesisUtterance(words))
  } catch {
    // Some pages block speech. The words still show on the screen.
  }
}

// Things a person can reach with the Tab key.
const FOCUSABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'

// After you turn this on, Chrome keeps keyboard focus in the side panel.
// A click on the black screen gives focus to the page. Then we jump to the
// first thing on the page, and Tab works from there.
function startReading(): void {
  const first = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
    (el) =>
      !el.closest('[data-blindspot]') && !el.hasAttribute('disabled') && el.getClientRects().length > 0,
  )
  if (first) {
    first.focus() // this runs onFocus, which says the name out loud
  } else {
    say('Nothing on this page can be reached with Tab.')
  }
}

// Images and headings do not get Tab focus on their own.
// While Screen Reader is on, we give them tabindex="0" so Tab can stop on them.
// We remember which ones we changed, so we can put the page back when it turns off.
const madeReachable: HTMLElement[] = []

function makeImagesAndHeadingsReachable(): void {
  document.querySelectorAll<HTMLElement>('img, h1, h2, h3, h4, h5, h6').forEach((el) => {
    if (el.hasAttribute('tabindex')) return // the page already decided
    if (el.closest('[data-blindspot]')) return
    if (el.closest('a, button')) return // the link or button reads it
    if (el.getAttribute('aria-hidden') === 'true') return
    if (el.getClientRects().length === 0) return // hidden

    if (el instanceof HTMLImageElement) {
      if (el.getAttribute('alt') === '') return // alt="" means decorative, so skip it
      const box = el.getBoundingClientRect()
      if (box.width < 20 || box.height < 20) return // tiny tracking pixels
    }

    el.setAttribute('tabindex', '0')
    madeReachable.push(el)
  })
}

function putTabindexBack(): void {
  madeReachable.forEach((el) => el.removeAttribute('tabindex'))
  madeReachable.length = 0
}

function onFocus(event: FocusEvent): void {
  const el = event.target
  if (!(el instanceof Element) || el.closest('[data-blindspot]')) return
  const name = getName(el)
  if (!name && el instanceof HTMLImageElement) {
    say('image, no alt text')
    return
  }
  const role = getRole(el)
  say(name ? `${name}, ${role}` : `${role}, no name`)
}

export function enableScreenReader(): void {
  if (overlay) return // already on

  overlay = document.createElement('div')
  overlay.setAttribute('data-blindspot', 'screen-reader') // so the accessibility scan skips it
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;' +
    'align-items:center;justify-content:center;padding:40px;'

  caption = document.createElement('div')
  caption.style.cssText =
    'color:#fff;font:28px/1.4 system-ui,sans-serif;text-align:center;max-width:800px;'
  overlay.appendChild(caption)
  overlay.addEventListener('click', startReading)
  document.documentElement.appendChild(overlay)
  makeImagesAndHeadingsReachable()

  document.addEventListener('focusin', onFocus, true)
  say('Screen reader on. Click this screen, then press Tab.')
}

export function disableScreenReader(): void {
  if (!overlay) return
  document.removeEventListener('focusin', onFocus, true)
  try {
    speechSynthesis.cancel()
  } catch {
    // nothing to stop
  }
  putTabindexBack()
  overlay.remove()
  overlay = null
  caption = null
}
