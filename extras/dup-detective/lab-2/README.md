# dup-triage: checkpoint after Lab 2

Adds to Lab 1:

- **Memory**: verdicts are kept in `dup-triage-verdicts.json`. A second run
  reuses a verdict when neither issue changed, and the report says how many
  pairs it reused.
- **Subagents**: more than 12 issues are split into batches of about 12. One
  background subagent runs per batch (`spawn_run`), and the main agent checks
  and merges their candidates.
- `agents/dup-triage.json` gains `@kirocrew-core` (the spawn and memory tools).
- `app.json` version `0.2.0`. The schedule is still paused.

## Use this checkpoint

From the root of your clone:

```bash
rm -rf dup-triage && cp -R checkpoints/lab-2 dup-triage
kirocrew app uninstall dup-triage      # only if an older copy is installed
kirocrew app install "$PWD/dup-triage"
```

Trust it in the dashboard: Apps → Library → Show N disabled apps → Dup Detective → ⋯ → Enable → **Trust this app and enable**. Do not turn on *Trust every third-party app* in Settings. Once trusted, the terminal also works:

```bash
kirocrew app enable dup-triage
```

## Check

Run it twice on `data/issues.json`. The first report shows the subagents.
The second shows reused verdicts. `kirocrew spawn list` shows the subagent runs.
