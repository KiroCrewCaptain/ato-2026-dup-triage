# Backlog Factory, Lab 2: Reproduce

The app after Lab 2 (v0.2.0) = Lab 1 plus:

| Part | What it does |
|---|---|
| `skills/factory-reproduce/SKILL.md` | for each bug: run jot with a throwaway notes file, paste the real output, add the root cause; helpers in batches |
| `agents/factory-reproducer.json` | the helper agent: reproduces 2-3 bugs in your folder and replies with the real output |
| `agents/backlog-factory.json` | gains `@kirocrew-core` and may start `factory-reproducer` helpers (`spawn_run`) |

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

`expected/` holds one real run's `board.json` (and, in Lab 3, the saved diff). Copy it to
`factory/board.json` if your run is slow; it is an example, not the answer key.
