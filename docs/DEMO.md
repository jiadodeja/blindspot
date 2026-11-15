# Demo script (2 minutes max)

Two people. Jia drives the laptop. Jay talks. Or switch, whatever feels natural. Practice it twice.

## Before judges come (checklist)
- [ ] Extension is built, loaded, and **pinned** in the Chrome toolbar
- [ ] Open tab 1: https://hackprinceton.com
- [ ] Open tab 2: our demo page (`/demo-page.html` on our Vercel domain). This is the backup.
- [ ] **Refresh both tabs** after the last extension reload
- [ ] Click Scan Page and Suggest fix once on each tab, so you know the AI is awake and the internet works
- [ ] Reset all lenses, close the side panel, laptop plugged in, notifications off
- [ ] Wifi works. If not, use a phone hotspot.

## The script

**0:00 to 0:15. Hook** (say it, no clicking yet)
"Most of us build websites on a big bright screen with a mouse. Blindspot lets you feel your own site the way other people have to use it. Then it helps you fix it."

**0:15 to 0:50. Simulate: tunnel vision** (tab 1, HackPrinceton site)
- Open the Blindspot panel, go to Simulate.
- Turn on **Tunnel Vision**. Add a little **Blur**.
- Say: "Try to find the Apply button." Move the mouse around slowly so judges see how hard it is.
- Say: "This is how some people with limited vision use the web every day."

**0:50 to 1:05. Simulate: keyboard only**
- Turn on **Keyboard Only**. Press **Tab** a few times.
- Say: "Now imagine you can't use a mouse. Can you tell where you are on the page? When the focus ring is missing, you can't."
- Click **Reset All**.

**1:05 to 1:25. Quick Fix: scan**
- Go to the **Quick Fix** tab and click **Scan Page**.
- Say: "Blindspot runs a real accessibility scan on the live page. Every problem becomes a card, worst first."
- Click **Show on page** on one card so judges see the orange outline on the real element.

**1:25 to 1:50. Quick Fix: AI fix and preview**
- Click **Suggest fix** on a card. While it loads, say: "We only send this one element, not the whole page."
- Read the "Who it hurts" line out loud.
- Click **Preview**. The page changes. Then click **Undo preview**. Then click **Copy code**.

**1:50 to 2:00. Close**
"Blindspot makes developers feel the problem first, then fix it. Built with React, axe-core, and Claude. Thank you!"

## Notes
- Say that we love the HackPrinceton site. We scanned it as a real example. It is not a criticism.
- If the HackPrinceton site changes or has no problems, switch to tab 2 (the demo page). It has a tiny Register button in the corner, a missing image description, and low contrast text on purpose.
- If Suggest fix is slow, keep talking about privacy: the key is only on Vercel, and only one element is sent.
- If the panel will not scan, **refresh the page** and try again.
- If everything breaks, show a screen recording. Record one tonight and keep it on the desktop.
