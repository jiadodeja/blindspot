# Blindspot

Blindspot is a Chrome extension that lets you feel what your own website is like to use with a disability. Then it helps you fix what's broken.

Made at HackPrinceton Fall 2026 by Jia Dodeja and Jay.

## Why we made it

When we build a website, we look at it on a big bright screen and click around with a mouse. That is not how everyone uses it. Some people have low vision. Some can only use a keyboard. Some find tight, crowded text really hard to read.

Accessibility checkers give you a list of errors, but a list doesn't make you feel anything. We wanted people to feel the problem first, and then fix it.

## What it does

Open any website, click the Blindspot icon, and a side panel opens. It has two tabs.

### Simulate

Turn on a lens and try to use your own page through it.

- **Blur** goes from 2px up to 10px.
- **Grayscale** takes the color out.
- **Tunnel Vision** darkens the page so only a small circle around your mouse stays clear.
- **Dyslexia & Visual Stress** makes text crowded and unstable. It is only an illustration. It is not what dyslexia is like for everyone.
- **Text Scaling** goes from 100% up to 200%.
- **Keyboard Only** blocks the mouse and adds a strong focus ring. Use Tab, Shift+Tab, Enter and Space. If a button has no visible focus, you will notice right away.
- **Screen Reader** turns the page black and reads things out loud as you press Tab. It stops on links, buttons, form fields, headings and images. Click the black screen once to start, then press Tab. If a button has no name, it says "no name." If an image has no alt text, it says "no alt text."

Most lenses can run together. Keyboard Only can't run with Tunnel Vision or Screen Reader, because those two need the mouse. Turning on Keyboard Only switches those two off, and turning on either of them switches Keyboard Only off. Reset All clears everything.

### Quick Fix

1. **Scan Page** runs axe-core on the live page. It checks the WCAG 2.0 and 2.1 rules at levels A and AA.
2. Each problem becomes a card with how serious it is and a plain explanation. The worst ones come first. We show up to 3 per rule and 40 in total, so the list stays readable.
3. **Show on page** puts an outline around the broken element.
4. **Suggest fix** asks Claude who the problem hurts and for fixed HTML.
5. **Preview** puts the fix on your real page. **Undo preview** puts the old element back.
6. **Copy code** copies the fixed HTML so you can paste it into your project.

Some fixes, like a missing `aria-label`, don't change how the page looks. You can't see them in the preview.

## What we send to the AI

Only the one broken element's HTML (cut short), its text color, background color and font size, and the name of the axe rule. We don't send the whole page, the page address, or any screenshots.

The Anthropic API key lives only in a Vercel environment variable. It is never inside the extension. Before we preview a fix, we also remove any scripts and event handlers from it.

## What it can't do yet

- axe-core can't check text color when the background is a picture, a gradient or a texture. It puts those in a "needs review" pile, and we don't show that pile. So Blindspot misses some low contrast text.
- It skips iframes and shadow DOM.
- It works in Chrome, on normal http and https pages. It does not work on `chrome://` pages.
- AI fixes can be wrong. Read a fix before you paste it.
- Screen Reader mode uses the browser's built-in voice. It does not read plain paragraphs yet, only the things listed above. It gives a rough idea, but it is not a replacement for testing with a real screen reader.
- After you reload the extension, refresh the web page too. Old pages don't get the new code.

## Run it

You need Node 18 or newer and Chrome.

1. `npm install`
2. `npm run build`
3. Open `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and pick the `dist` folder.
4. Open a normal website, then click the Blindspot icon.

After you change code, run `npm run build`, click the reload arrow on the extension, and refresh the page.

There is a practice page with problems on purpose in `public/demo-page.html`. It is also on our Vercel site at `/demo-page.html`. Open it from the website, not as a file on your computer, because Chrome won't run extensions on local files.

## Set up the AI part

The AI part is one small Vercel function in `api/suggest-fix.ts`.

1. Make a Vercel project from this repo.
2. Add an environment variable named `ANTHROPIC_API_KEY`. You can also set `MODEL`. The default is `claude-sonnet-5-5`.
3. Deploy. Then put your domain in two places: `src/sidepanel/config.ts` and `host_permissions` in `manifest.config.ts`.
4. Build the extension again.

## How the pieces fit together

- **Side panel** (React and TypeScript) is the UI. It sends messages to the page.
- **Content script** runs inside the page. The lenses are in `src/content/effects`. The scan and the preview are in `src/content/quickfix`.
- **Background worker** opens the side panel when you click the icon.
- **Vercel function** talks to Claude.

The message types are in `src/shared/messages.ts`.

## Tests

With Node 24, run `npm run test:effects`. The tests cover how the effects are switched on and off, how the panel talks to the page, and the Dyslexia & Visual Stress code. They don't test how things look in Chrome.

## Built with

React, TypeScript, Vite, CRXJS, Chrome Manifest V3, the Chrome Side Panel API, axe-core, Vercel serverless functions, and Claude (Anthropic API).
