# Backlog Factory, Lab 3: Fix ⇄ Review

The app after Lab 3 (v0.3.0) = Lab 2 (including the `factory-reproducer` helper) plus:

| Part | What it does |
|---|---|
| `agents/factory-fixer.json` | writes the smallest fix and a test, in its own git worktree |
| `agents/factory-reviewer.json` | a fresh reviewer: reads the diff, runs the tests, says GREEN or CHANGES; never edits |
| `skills/factory-fix-review/SKILL.md` | the loop: the main agent conducts, at most 3 rounds, then **Ready to merge** |

Needs git. The fix lives on a local branch `factory/fix-<n>`. You read the diff on
the page and run `git merge factory/fix-<n>` yourself.

## Install

From your folder (macOS / Linux):

```bash
rm -rf backlog-factory && cp -R checkpoints/lab-3 backlog-factory
kirocrew app uninstall backlog-factory      # only if an older copy is installed
kirocrew app install "$PWD/backlog-factory"
```

Then **Library → Show N disabled apps → Backlog Factory → ⋯ → Enable → Trust this app
and enable**. Open **Backlog Factory** in the sidebar, set **Repo folder**, press
**Save**, then **Run now**.

Nothing here writes to GitHub. The factory writes only `factory/` in your folder.

`expected/` holds one real run's `board.json` (and, in Lab 3, the saved diff). Copy it to
`factory/board.json` if your run is slow; it is an example, not the answer key.
