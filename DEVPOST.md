# Blindspot

**Tagline:** Feel what your website is like with a disability, then fix it.

## Inspiration

When we build websites, we look at them on a big bright screen with a mouse. We almost never try them the way a lot of people have to. Some people have low vision. Some use only a keyboard. Some have dyslexia and find tight text really hard to read.

Accessibility checkers give you a list of errors. But a list does not make you feel anything. We wanted developers to feel the problem first, and then fix it. We think that is how you actually learn to care about it, which is why we picked the Education track.

## What it does

Blindspot is a Chrome extension with a side panel. You open your own website, then open the panel.

**Simulate tab.** Flip on a lens and try to use your site. You can blur and gray out the page for low vision, or turn on tunnel vision, where only a small circle around your mouse is clear. You can change letter and word spacing for reading, scale the text up to 200 percent, and try keyboard-only mode, which highlights the focused element so missing focus rings show up. You can combine lenses, and one Reset button clears them all.

**Quick Fix tab.** Click Scan Page and Blindspot runs axe-core on the live page. Every problem becomes a card with a severity and a plain explanation. Click Suggest fix and an AI tells you who the problem hurts and gives you fixed code. Click Preview and the fix appears on your real page. Undo puts it back. Copy code gives you the fix to paste into your own project.

## How we built it

- The panel is React and TypeScript, built with Vite and CRXJS on Chrome Manifest V3 and the Side Panel API.
- A content script runs inside the page. It applies the effects, runs axe-core, and swaps in preview fixes.
- A small Vercel serverless function calls Claude. The API key lives only in a Vercel environment variable, so it is never inside the extension.
- We only send the one broken element's HTML, its colors and the rule name. We do not send the whole page.
- Claude sometimes wraps its JSON in code fences, so our function takes the text between the first { and the last } before parsing.

## Challenges we ran into

- A Chrome extension has three separate parts (the panel, the page script, and the background worker) and they cannot just call each other. We had to design a clear list of messages between them.
- After you reload an extension, old tabs lose the connection until you refresh the page. That confused us for a while.
- A fix from the AI is HTML, and putting it into a live page can be unsafe. So we strip scripts and event handlers before we preview it.
- Our team went from 3 people to 2 late on Saturday, so we had to cut some ideas and focus.

## Accomplishments that we're proud of

- The Preview button. You see a fix working on your real page in one click, and you can undo it.
- We ran the scan on real sites, including the HackPrinceton website, and it found real problems.
- The API key never touches the extension.

## What we learned

- How Chrome extensions pass messages between the side panel and a page.
- How to run axe-core inside a content script.
- That a good prompt needs very tight rules if you want clean JSON back.
- That feeling a problem teaches more than reading about it.

## What's next

- Screen reader mode, where the page goes black and you only hear it read aloud.
- Challenge mode: pick a task like "find the Register button," turn on a lens, and time how long it takes.
- Sending a small screenshot of the broken element so the AI sees what the user sees.
- Scanning inside iframes.

## Built with

React, TypeScript, Vite, CRXJS, Chrome Extension Manifest V3, Chrome Side Panel API, axe-core, Vercel, Anthropic API (Claude)

## Try it

Code: https://github.com/jiadodeja/blindspot
