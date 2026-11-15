// Person B: scan the page with axe-core and turn the results into a simple list.
import axe from 'axe-core'
import type { A11yIssue, Impact } from '../../shared/messages'

const ORDER: Impact[] = ['critical', 'serious', 'moderate', 'minor']
const MAX_PER_RULE = 3 // some pages have 200 low-contrast spots, we only need a few
const MAX_TOTAL = 40

// Screen Reader mode adds a tabindex to images and headings. That is our change, not the page's.
// Take it out before the HTML goes anywhere, or the AI will think the page had it.
function cleanHtml(el: Element): string {
  if (!el.hasAttribute('data-blindspot-reach') && !el.querySelector('[data-blindspot-reach]')) return el.outerHTML
  const copy = el.cloneNode(true) as Element
  const ours = [copy, ...Array.from(copy.querySelectorAll('[data-blindspot-reach]'))]
  ours.forEach((node) => {
    if (node.hasAttribute('data-blindspot-reach')) {
      node.removeAttribute('tabindex')
      node.removeAttribute('data-blindspot-reach')
    }
  })
  return copy.outerHTML
}

export async function scanPage(): Promise<A11yIssue[]> {
  // clear stamps from an older scan
  document.querySelectorAll('[data-aq-id]').forEach((el) => el.removeAttribute('data-aq-id'))

  const results = await axe.run(
    // skip anything Blindspot itself adds to the page (Person A: put data-blindspot on your overlays)
    { exclude: [['[data-blindspot]']] },
    {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      resultTypes: ['violations'],
    },
  )

  const issues: A11yIssue[] = []
  for (const rule of results.violations) {
    let count = 0
    for (const node of rule.nodes) {
      if (count >= MAX_PER_RULE) break
      const firstTarget = node.target[0]
      if (typeof firstTarget !== 'string') continue // skip iframes and shadow DOM for now
      let el: Element | null = null
      try {
        el = document.querySelector(firstTarget)
      } catch {
        el = null
      }
      if (!el) continue

      const id = `${rule.id}-${count}`
      const html = cleanHtml(el).slice(0, 1500) // take it BEFORE we stamp our own attribute on it
      el.setAttribute('data-aq-id', id) // so we can find this element again later
      count++

      const css = getComputedStyle(el)
      // for color contrast, axe already worked out the real colors
      const data = (node.any[0]?.data ?? {}) as { fgColor?: string; bgColor?: string }
      const tag = el.tagName.toLowerCase()

      issues.push({
        id,
        ruleId: rule.id,
        impact: (rule.impact ?? 'minor') as Impact,
        help: rule.help,
        description: rule.description,
        html,
        selector: firstTarget,
        styles: {
          color: data.fgColor ?? css.color,
          backgroundColor: data.bgColor ?? css.backgroundColor,
          fontSize: css.fontSize,
        },
        canPreview: tag !== 'html' && tag !== 'head' && tag !== 'body',
      })
    }
  }

  // worst problems first
  issues.sort((a, b) => ORDER.indexOf(a.impact) - ORDER.indexOf(b.impact))
  return issues.slice(0, MAX_TOTAL)
}
