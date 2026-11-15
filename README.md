# Blindspot

A Chrome extension that lets web developers feel what their own site is like to use with a disability. Then it finds accessibility problems on the page and uses AI to suggest fixes.

Made at HackPrinceton Fall 2026 by Jia Dodeja and Jay.

## What it does

**Simulate tab.** Turn on a "lens" and use your own page through it. Lenses can be combined, and Reset removes them all.
- Blur (amount dropdown from Off to 10px)
- Grayscale (independent on/off toggle)
- Tunnel vision (a dark mask with a small clear circle that follows the mouse)
- Reading help for dyslexia (letter spacing, word spacing, line height)
- Text scaling up to 200 percent
- Keyboard only (highlights the focused element so missing focus rings show up)

**Quick Fix tab.**
1. **Scan Page** runs axe-core on the live page.
2. Each problem becomes a card with a severity badge and a plain explanation.
3. **Show on page** scrolls to the element and flashes an outline around it.
4. **Suggest fix** sends the broken element to our AI backend. It sends back who the problem hurts, a plain explanation, and fixed code.
5. **Preview** puts the fix on the live page. **Undo preview** puts the old element back.
6. **Copy code** copies the fixed HTML.

Blur and grayscale are connected to the current page and can be combined independently. Turning both off, or using Reset All, removes the Blindspot filter stylesheet. The sidebar reads settings when it opens and when the active page changes. Other simulation functions remain TODO stubs. See [docs/TASKS.md](docs/TASKS.md) for the remaining work.

## What we send to the AI

Only the one broken element's HTML (cut to 2000 characters), its colors and font size, and the axe rule name. We never send the whole page or the page address. The Anthropic API key lives only in a Vercel environment variable. It is not in the extension.

## How to run it

You need Node 18 or newer and Chrome.

1. `npm install`
2. `npm run build`
3. Open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and pick the `dist` folder.
4. Open any normal website (not a `chrome://` page), then click the Blindspot icon. The side panel opens.

After you change code: run `npm run build`, click the reload arrow on the extension, and **refresh the web page**. Old pages do not get the new content script.

A test page with problems on purpose is in `public/demo-page.html`. After you build, open `dist/demo-page.html` through a web server, or use the deployed copy at `/demo-page.html` on our Vercel domain.

## Testing Simulate

Use Node 24 and run `npm run test:effects` to test the effect manager, Simulate message handling, and shared router. Tests cover dispatch with effect spies and real blur/grayscale modules using a small DOM fixture. They verify filter combinations, stylesheet cleanup, and preservation of page style declarations. They do not test rendering in Chrome.

## The AI backend

`api/suggest-fix.ts` is one small Vercel serverless function that calls the Anthropic API.

To set it up yourself:
1. Make a Vercel project from this repo.
2. Add an environment variable `ANTHROPIC_API_KEY`. You can also set `MODEL` (the default is `claude-sonnet-5-5`).
3. Deploy, then put your domain in two places: `src/sidepanel/config.ts` and `host_permissions` in `manifest.config.ts`.
4. Rebuild the extension.

## How the pieces talk

- **Side panel** (React): the UI. It sends messages to the page.
- **Content script**: runs inside the page. It applies the effects, runs the scan, and previews fixes. `src/content/index.ts` hands each message to the Simulate code or the Quick Fix code.
- **Background worker**: opens the side panel when you click the icon.
- **Vercel function**: talks to the AI.

The message list is in `docs/MESSAGES.md`, and the types are in `src/shared/messages.ts`.

## Built with

React, TypeScript, Vite, CRXJS, Chrome Manifest V3 and the Side Panel API, axe-core, Vercel serverless functions, and Claude (Anthropic API).
