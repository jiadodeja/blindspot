# Tasks (updated Sat 7:20 pm, team of 2)

Jia = Person B (Quick Fix) and owns Vercel, GitHub, and shared files.
Jay = Person A (Simulate).
Claude writes README, Devpost draft and demo script.

## Cut from the plan (only add back if there is time before 2 am)
- Screen reader mode
- Challenge mode
- Screenshot crop
- OpenDyslexic font

## Deadlines
- [ ] 9:30 pm Sat: Vercel deployed, AI fix works end to end (Jia)
- [ ] 10:30 pm Sat: all core simulations work (A), merge into main
- [ ] 11:30 pm Sat: both branches merged, demo run-through on the HackPrinceton site
- [ ] 2 am Sun: FEATURE FREEZE. Only bug fixes after this
- [ ] Well before 8 am Sun: SUBMIT on Devpost
- [ ] 9:30 am to 2:30 pm Sun: judges visit, 2 minute demo

## Jia: Person B (branch: feature/quickfix) and setup
- [x] Repo, scaffold, side panel opens
- [ ] Commit the Quick Fix code (scan, cards, preview, copy)
- [ ] Deploy to Vercel with ANTHROPIC_API_KEY
- [ ] Put the Vercel domain in `src/sidepanel/config.ts` and `manifest.config.ts`
- [ ] Test Scan, Suggest fix, Preview, Undo, Copy on the HackPrinceton site
- [ ] Make the prompt better if fixes look weak (`api/suggest-fix.ts`)
- [ ] Submit on Devpost, connect agent at chatoverflow.dev/leaderboard/hackprinceton

## Jay: Person A, Simulate tab (branch: feature/simulate)
Files you own: `src/content/effects/index.ts` (and any files inside `src/content/effects/`), `src/sidepanel/SimulateTab.tsx`, `src/sidepanel/tips.ts`, `tests/effects.test.mjs`
- [ ] Handle APPLY_EFFECTS, RESET_EFFECTS, GET_EFFECTS in `handleEffects`
- [ ] Manager calls each effect's enable/update or disable function using the full settings
- [ ] Implement remaining effect stubs; screen reader remains cut from scope
- [ ] Test manager dispatch, parameters, reset, stored settings, and independent toggles with `npm run test:effects` (Node 24)
- [ ] Use separate blur and grayscale settings in EffectSettings
- [ ] Blur: Eye icon, amount dropdown from Off to 10px, module stores intensity only
- [ ] Grayscale: gray Contrast icon, separate on/off toggle, module stores 0 or 100 percent
- [ ] Manager combines blur and grayscale in one data-blindspot stylesheet on html
- [ ] Remove the filter stylesheet when both effects are off or Reset All is used
- [ ] Tunnel vision: dark mask with a clear circle that follows the mouse
- [ ] Dyslexia: letter spacing, word spacing, line height
- [ ] Text scaling up to 200 percent
- [ ] Keyboard only: strong outline on the focused element
- [ ] SimulateTab reads GET_EFFECTS on open and page changes, sends full settings on control changes, and handles errors
- [ ] A "what to check" tip under each mode
- [ ] Reset button sends RESET_EFFECTS, all effects can be combined
- [ ] Verify blur and grayscale together, separately, and after reset in Chrome
- [ ] Put `data-blindspot` on any overlay you add to the page

## Shared rules
- Own files only. Ask Jia before you edit `manifest.config.ts`, `src/shared/messages.ts`, `src/content/index.ts`, or `src/sidepanel/App.tsx`.
- `git pull origin main` before you push.
- After you change code: `npm run build`, reload the extension in chrome://extensions, refresh the web page.
- Small commits with plain messages like "add tunnel vision effect".
