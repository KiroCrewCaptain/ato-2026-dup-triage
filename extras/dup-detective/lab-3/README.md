# dup-triage: checkpoint after Lab 3

Adds to Lab 2:

- **Schedule**: `dup-triage-daily` runs weekdays at 7:00 AM `America/New_York`.
  It ships paused. Resume it on the Schedule page, or run it once right now
  with `kirocrew cron trigger JOB_ID` (the ID is in `kirocrew cron list`).
  A scheduled run never posts.
- **Boundary**: section 8 of the skill. The app posts one comment, only on
  your own fork, only after it shows you the exact command and you answer
  yes in chat. It refuses to write to `KiroCrewCaptain/ato-2026-dup-triage`.
- **Page**: a Dup Detective page in the sidebar (`ui/`). It shows the schedule
  state and the boundary, and drafts a run in a new chat for you to send.
  `ui/dist/index.mjs` is pre-built, so installing needs no Node.js.
  `app.json` declares `"api": ["/api/crons"]` for the schedule card.
- `app.json` version `0.3.0`.

## Use this checkpoint

From the root of your clone:

```bash
rm -rf dup-triage && cp -R checkpoints/lab-3 dup-triage
kirocrew app uninstall dup-triage      # only if an older copy is installed
kirocrew app install "$PWD/dup-triage"
```

Trust it in the dashboard: Apps → Library → Show N disabled apps → Dup Detective → ⋯ → Enable → **Trust this app and enable**. Do not turn on *Trust every third-party app* in Settings. Once trusted, the terminal also works:

```bash
kirocrew app enable dup-triage
```

To change the page, edit `ui/src/App.tsx`, then
`cd ui && npm install && npm run build` (needs Node.js 24 LTS), then
reinstall.

## Check

- `kirocrew cron list` shows `dup-triage/dup-triage-daily`, paused.
- Ask it to post on `KiroCrewCaptain/ato-2026-dup-triage`: it refuses.
- Ask it to post on an issue in your fork: it shows the command and waits
  for your yes.
