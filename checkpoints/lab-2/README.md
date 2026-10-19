# Backlog Factory, Lab 2: Reproduce

The app after Lab 2 (v0.2.0) = Lab 1 plus:

| Part | What it does |
|---|---|
| `skills/factory-reproduce/SKILL.md` | for each bug: run jot with a throwaway notes file, paste the real output, add the root cause; helpers in batches |
| `agents/backlog-factory.json` | gains `@kirocrew-core`, so it can start helper agents (`spawn_run`) |

Each helper waits for your OK: **Review in panel → Allow**. A re-run only does new
work: the board is the memory.

## Install

From your folder (macOS / Linux):

```bash
rm -rf backlog-factory && cp -R checkpoints/lab-2 backlog-factory
kirocrew app uninstall backlog-factory      # only if an older copy is installed
kirocrew app install "$PWD/backlog-factory"
```

Then **Library → Show N disabled apps → Backlog Factory → ⋯ → Enable → Trust this app
and enable**. Open **Backlog Factory** in the sidebar, set **Repo folder**, press
**Save**, then **Run now**.

Nothing here writes to GitHub. The factory writes only `factory/` in your folder.
