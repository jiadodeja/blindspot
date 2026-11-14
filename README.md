# Blindspot

A Chrome extension that lets web developers feel what their own site is like to use with a disability. Then it finds accessibility problems and uses AI to suggest fixes.

Made at HackPrinceton Fall 2026.

## What it does
- Simulate tab: low vision, tunnel vision, dyslexia, text scaling, keyboard only. Toggles can be combined.
- Quick Fix tab: scans the page with axe-core, shows each problem as a card, asks AI for a fix, previews it live, and copies the code.

## How to run it
1. Install Node 18 or newer.
2. `npm install`
3. `npm run build`
4. Open `chrome://extensions`, turn on Developer mode, click "Load unpacked", and pick the `dist` folder.
5. Open any website, then click the Blindspot icon in the toolbar to open the side panel.

For live reload while coding, use `npm run dev` and load the `dist` folder.

## AI backend
`api/suggest-fix.ts` is one Vercel serverless function. It sends only the broken element's HTML, its colors, and the rule name to the Anthropic API. The API key is a Vercel environment variable (`ANTHROPIC_API_KEY`). It is never in the extension.

## Team
TODO: add names.
