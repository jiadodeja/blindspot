// Vercel serverless function. Calls the Anthropic API.
// The API key lives only in the Vercel env var ANTHROPIC_API_KEY.
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Checked in the Anthropic docs on Nov 14 2026. Change it with the MODEL env var.
const MODEL = process.env.MODEL || 'claude-sonnet-5-5'

const SYSTEM_PROMPT = `You are an accessibility expert helping a web developer.
You get ONE broken HTML element, its colors, and the name of the axe-core rule it broke.
Reply with JSON only. Use exactly this shape:
{"who": "...", "explanation": "...", "fixedHtml": "..."}
Rules:
- "who": one or two plain sentences about which people this hurts (for example blind users with screen readers).
- "explanation": two or three plain sentences. Say why it is a problem and what your fix changes.
- "fixedHtml": the fixed version of the SAME element. Keep the same tag, classes and ids. Change as little as possible.
- The HTML you get may be cut off if the element is very big. Most fixes are on the opening tag (like aria-label, alt, or style), so always make sure the opening tag is complete and fixed.
- For color contrast, pick colors that pass WCAG AA (4.5 to 1 for normal text). Use inline style on the element.
- For missing alt text, write alt text that describes the image. If it looks decorative, use alt="".
- Do not add scripts. Do not add markdown or code fences. JSON only.`

// Claude sometimes wraps JSON in code fences. Take the text between the first { and the last }.
export function extractJson(text: string): any {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in the AI reply')
  return JSON.parse(text.slice(start, end + 1))
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// One call to Claude. Returns the reply text and why it stopped.
async function askClaude(apiKey: string, content: any[]) {
  const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096, // big elements need room, or the JSON gets cut off
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  })
  const data = await apiRes.json()
  if (!apiRes.ok) throw new Error('Anthropic error: ' + (data?.error?.message ?? apiRes.status))
  const text = data.content?.find((b: any) => b.type === 'text')?.text ?? ''
  return { text: text as string, stopReason: data.stop_reason as string }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end() // browser preflight check
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Server has no API key' })

  const { ruleId, impact, help, html, styles, screenshotBase64 } = req.body || {}
  if (!ruleId || !html) return res.status(400).json({ error: 'Need ruleId and html' })

  // Keep the input small so nobody can run up our bill
  const userText = `Rule: ${ruleId} (${impact})\nWhat it means: ${help}\nColors: text ${styles?.color}, background ${styles?.backgroundColor}, font size ${styles?.fontSize}\nElement HTML:\n${String(html).slice(0, 2000)}`

  const content: any[] = []
  if (screenshotBase64 && String(screenshotBase64).length < 400_000) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 },
    })
  }
  content.push({ type: 'text', text: userText })

  try {
    // Try up to 2 times. Sometimes the reply is not valid JSON.
    let lastStop = ''
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { text, stopReason } = await askClaude(apiKey, content)
      lastStop = stopReason
      try {
        const parsed = extractJson(text)
        return res.status(200).json({
          who: String(parsed.who ?? ''),
          explanation: String(parsed.explanation ?? ''),
          fixedHtml: String(parsed.fixedHtml ?? ''),
        })
      } catch {
        // bad JSON, loop and try once more
      }
    }
    return res.status(502).json({ error: 'The AI reply was not valid JSON. Try again.', detail: 'stop reason: ' + lastStop })
  } catch (err: any) {
    return res.status(500).json({ error: 'Could not get a fix', detail: err?.message })
  }
}
