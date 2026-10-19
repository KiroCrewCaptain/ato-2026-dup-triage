# dup-triage: checkpoint after Lab 1

What this app can do now: read the issues, find duplicate groups, and explain
every match with a quote from each issue. It writes `dup-triage-report.md` and
posts nothing.

Started from the real scaffold `kirocrew app init dup-triage --cron`, then:

- `skills/dup-triage/SKILL.md`: the triage rules (was `sample-skill`).
- `agents/dup-triage.json`: the agent, with file and shell tools (was `sample-agent`).
- `app.json`: the schedule is a weekday 7:00 AM job in `America/New_York`,
  shipped paused (`"enabled": false`), with `"permissions": {"cron": true}`.
  Lab 3 is where you turn it on.

## Use this checkpoint

From the root of your clone:

```bash
rm -rf dup-triage && cp -R checkpoints/lab-1 dup-triage
kirocrew app uninstall dup-triage      # only if an older copy is installed
kirocrew app install "$PWD/dup-triage"
```

Trust it in the dashboard: Apps → Library → Show N disabled apps → Dup Detective → ⋯ → Enable → **Trust this app and enable**. Do not turn on *Trust every third-party app* in Settings. Once trusted, the terminal also works:

```bash
kirocrew app enable dup-triage
```

Uninstalling also removes the trust, so trust it again after each reinstall.

## Check

Ask in a dashboard chat: `Use the dup-triage skill on data/issues.json.`
Compare the report with `answer-key.md`.
