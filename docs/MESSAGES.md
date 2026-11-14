# Messages

The real types live in `src/shared/messages.ts`. This file explains them in plain words.
Person C owns both. Ask C before you change a message.

## How messages move

- The side panel is the boss. It sends a message to the page (the content script) with `chrome.tabs.sendMessage(tabId, message)`.
- The content script answers by calling `sendResponse(reply)`. Every reply has `ok: true` or `ok: false` with an `error` text.
- To get the tab id, the panel uses `chrome.tabs.query({ active: true, currentWindow: true })`.
- The background worker only takes screenshots. The panel calls it with `chrome.runtime.sendMessage(message)`.
- The AI call is NOT a chrome message. The panel just uses `fetch` to our Vercel URL.

## Simulate tab (Person A)

| Message (panel to page) | Data | Reply |
|---|---|---|
| `APPLY_EFFECTS` | `settings`: the full `EffectSettings` object | `{ ok: true, type: 'DONE' }` |
| `RESET_EFFECTS` | nothing | `{ ok: true, type: 'DONE' }` |
| `GET_EFFECTS` | nothing | `{ ok: true, type: 'EFFECTS', settings }` |

Why one `APPLY_EFFECTS` with everything? Toggles can be combined. So the panel sends the whole state each time, and the content script makes the page match it. This is easier than many small on/off messages. The panel calls `GET_EFFECTS` when it opens so the toggles match the page.

## Quick Fix tab (Person B)

| Message (panel to page) | Data | Reply |
|---|---|---|
| `SCAN_PAGE` | nothing | `{ ok: true, type: 'SCAN_RESULT', issues }` |
| `HIGHLIGHT_ISSUE` | `issueId` | `{ ok: true, type: 'DONE' }` |
| `PREVIEW_FIX` | `issueId`, `fixedHtml` | `{ ok: true, type: 'DONE' }` |
| `UNDO_PREVIEW` | `issueId` | `{ ok: true, type: 'DONE' }` |
| `GET_ELEMENT_RECT` (stretch) | `issueId` | `{ ok: true, type: 'ELEMENT_RECT', rect, devicePixelRatio }` |

An issue (`A11yIssue`) has: `id`, `ruleId`, `impact`, `help`, `description`, `html`, `selector`, `styles`.

How the content script finds the element again: during the scan, it stamps each bad element with `data-aq-id="<issueId>"`. Later messages use `document.querySelector('[data-aq-id="..."]')`. For undo, it keeps the original `outerHTML` in a Map.

## Background worker (stretch)

| Message (panel to background) | Reply |
|---|---|
| `CAPTURE_TAB` | `{ ok: true, type: 'SCREENSHOT', dataUrl }` |

Screenshot plan: panel asks the page for `GET_ELEMENT_RECT`, asks the background for `CAPTURE_TAB`, then crops with a canvas. Multiply the rect by `devicePixelRatio` when cropping. Keep the crop small (under 400 px wide) so the upload is fast.

## AI backend

`POST https://YOUR-APP.vercel.app/api/suggest-fix`, JSON body, plain `fetch` from the panel.

Send (`SuggestFixRequest`): `ruleId`, `impact`, `help`, `html`, `styles`, and optional `screenshotBase64`.
Nothing else leaves the page. No full page HTML, no URL.

Get back (`SuggestFixResponse`): `who`, `explanation`, `fixedHtml`.
On an error we get `{ error, detail }` with a 4xx or 5xx status. Show a friendly "try again" in the card.

## Challenge mode (stretch)

`START_TRACKING` and `STOP_TRACKING` go to the page. The page counts clicks, Tab presses, and time. `STOP_TRACKING` replies with `{ ok: true, type: 'TRACKING_RESULT', clicks, tabPresses, ms }`. We only add this type to `messages.ts` if we get there.
