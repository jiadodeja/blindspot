# Tasks

Owners: A = Simulate tab, B = Quick Fix tab, C = Jia (setup and glue).
Fill in the names for A and B once we know who they are.
Tick a box when it is merged into main.

## Deadlines (Sat Nov 14 to Sun Nov 15)
- [ ] 3 pm Sat: scaffold pushed, side panel opens (C)
- [ ] 8 pm Sat: simulations work, scan shows a list of problems (A, B)
- [ ] 11 pm Sat: AI fixes and Preview work (B, C)
- [ ] 2 am Sun: FEATURE FREEZE. After this only bug fixes, README, Devpost, demo practice
- [ ] Well before 8 am Sun: SUBMIT on Devpost
- [ ] 9:30 am to 2:30 pm Sun: judges visit, 2 minute demo

## Person C: Jia (branch: main first, then feature/ai-backend)
- [ ] Make a NEW public GitHub repo (must be created after Fri Nov 13, 8 pm)
- [ ] Scaffold Vite + React + TS + CRXJS, push to main
- [ ] Side panel opens when you click the toolbar icon
- [ ] Add A and B as collaborators, tell them to pull
- [ ] Put docs/TASKS.md and docs/MESSAGES.md in the repo
- [ ] Make a Vercel project from the repo
- [ ] Add ANTHROPIC_API_KEY (and optional MODEL) in Vercel env vars
- [ ] Deploy api/suggest-fix, test it with curl
- [ ] Put the real Vercel domain in manifest.config.ts host_permissions
- [ ] Tune the prompt on 5 or 6 real broken elements
- [ ] Merge main into your branch often, check the extension still loads
- [ ] README.md (what it is, how to run, how to load unpacked)
- [ ] DEVPOST.md first draft
- [ ] Demo script, practice 2 minutes twice
- [ ] Connect any coding agent at chatoverflow.dev/leaderboard/hackprinceton
- [ ] Submit on Devpost before 8 am

## Person A: Simulate tab (branch: feature/simulate)
Files you own: `src/content/effects/*`, `src/sidepanel/SimulateTab.tsx`, `src/sidepanel/tips.ts`
- [ ] Content script listens for APPLY_EFFECTS, RESET_EFFECTS, GET_EFFECTS
- [ ] Low vision: blur and grayscale
- [ ] Tunnel vision: dark mask with a clear circle that follows the mouse
- [ ] Dyslexia: letter spacing, word spacing, line height
- [ ] Text scaling up to 200 percent
- [ ] Keyboard only: strong outline on the focused element
- [ ] Toggle UI with sliders in SimulateTab
- [ ] A "what to check" tip under each mode
- [ ] Reset button removes everything, toggles can be combined
- [ ] OpenDyslexic font bundled locally (optional)
- [ ] Stretch: screen reader mode (black overlay and speechSynthesis)

## Person B: Quick Fix tab (branch: feature/quickfix)
Files you own: `src/content/scan.ts`, `src/content/preview.ts`, `src/sidepanel/QuickFixTab.tsx`, `src/sidepanel/IssueCard.tsx`
- [ ] Content script runs axe-core on SCAN_PAGE and returns A11yIssue[]
- [ ] Stamp each bad element with data-aq-id
- [ ] Issue cards with severity color and plain explanation
- [ ] Click a card to HIGHLIGHT_ISSUE on the page
- [ ] "Suggest fix" calls our Vercel URL, shows who it hurts and the fixed code
- [ ] "Preview" sends PREVIEW_FIX, and "Undo" sends UNDO_PREVIEW
- [ ] "Copy code" copies fixedHtml
- [ ] Loading and error states on the card
- [ ] Stretch: element screenshot crop sent with the request
- [ ] Stretch: Challenge mode

## Shared rules
- Own files only. Ask C before you edit `manifest.config.ts` or `src/shared/messages.ts`.
- `git pull origin main` before you push.
- Merge into main at least every 2 hours. After a merge, reload the extension and check it still opens.
- Small commits with plain messages like "add tunnel vision effect".
