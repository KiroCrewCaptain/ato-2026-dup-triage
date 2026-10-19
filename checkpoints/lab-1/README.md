# Backlog Factory, Lab 1: Sort

The app after Lab 1 (v0.1.0).

| Part | What it does |
|---|---|
| `app.json` | the app: one agent, one skill, a page, a small backend, a paused weekday cron job |
| `agents/backlog-factory.json` | the main agent: file + shell tools, GitHub read only |
| `skills/factory-triage/SKILL.md` | the rules: good problem? → five whys → first principles → Build / Reframe / Needs you / Reject; duplicates grouped; writes `factory/board.json` |
| `backend/routes.py` | serves `factory/board.json` to the page and saves your button decisions to `factory/decisions.json` |
| `ui/` | the board page (pre-built in `ui/dist`) |

Done when: about 100 cards on the board, each with a reason; compare with `answer-key.md`.

## Install

From your folder (macOS / Linux):

```bash
rm -rf backlog-factory && cp -R checkpoints/lab-1 backlog-factory
kirocrew app uninstall backlog-factory      # only if an older copy is installed
kirocrew app install "$PWD/backlog-factory"
```

Then **Library → Show N disabled apps → Backlog Factory → ⋯ → Enable → Trust this app
and enable**. Open **Backlog Factory** in the sidebar, set **Repo folder**, press
**Save**, then **Run now**.

Nothing here writes to GitHub. The factory writes only `factory/` in your folder.

`expected/` holds one real run's `board.json` (and, in Lab 3, the saved diff). Copy it to
`factory/board.json` if your run is slow; it is an example, not the answer key.
