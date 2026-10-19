# Build Your First Kiro Crew App: Backlog Factory

Starter repo for the All Things Open 2026 workshop
**"Build Your First Kiro Crew App"**: an agentic software factory that turns GitHub
issues into reviewed fixes
(Mon Oct 19, 2:30–4:30 PM ET, Room 304).

In two hours you build **Backlog Factory**, a [Kiro Crew](https://github.com/kirodotdev/KiroCrew)
app that works through a real issue backlog like a small software factory:

1. **Sort** every open issue: bug or feature? Is it a good problem? Five whys to the
   root cause, then first principles to the best fix. Verdict: Build, Reframe,
   Needs you, or Reject. Duplicates are grouped.
2. **Reproduce** each bug in your own folder, with the real command and its output.
3. **Fix ⇄ Review**: a fixer agent writes the fix on a local branch, a separate
   reviewer agent reads the diff and runs the tests, and they loop until the review
   is green. Then **you** merge.

Its page is a board with a count per lane. **It never writes to GitHub**: it reads the
issues, and everything it makes stays in your folder (fixes are local branches; a
"PR" here is a branch, its diff and the review verdict).

The issues come from `jot`, a tiny notes CLI in this repo (`jot/`, `JOT.md`): 100 open
issues, the kind every open-source maintainer gets.

## Before you arrive (about 20 minutes, ~1 GB of downloads)

1. **Install Kiro Crew.**
   - macOS: download [KiroCrew.dmg (Stable)](https://download.crew.kiro.dev/desktop/stable/latest/KiroCrew.dmg), drag it to Applications, open it once.
   - Windows: download [KiroCrew-Setup.exe (Stable)](https://download.crew.kiro.dev/desktop/stable/latest/KiroCrew-Setup.exe), run it, open Kiro Crew once.
   - Linux, or if you prefer a terminal:

     ```bash
     curl -fsSL https://download.crew.kiro.dev/cli.sh | sh
     kirocrew setup
     kirocrew gateway        # dashboard at http://localhost:5476; leave it running
     ```

     Linux only: if Kiro Crew shows **Sandbox unavailable**, run
     `sudo sysctl -w kernel.unprivileged_userns_clone=1`, then restart the gateway.

2. **Sign in.** The dashboard opens on the **Set up Kiro** page. Copy the
   sign-in command shown there, run it in a terminal, finish the sign-in in
   your browser, then press **Check sign-in again**.
3. **Python 3.9 or newer.** The factory runs `jot` to reproduce bugs. Check with
   `python3 --version` (Windows: `py --version`). On a fresh Mac, `python3` may first
   offer to install Apple's developer tools: say yes (this also gives you `git`).
4. **git** (for Lab 3 only). No git? Labs 1 and 2 still work from the ZIP.

No GitHub account, token or fork is needed today.

## Start here (first 5 minutes)

1. **Get the repo** (no fork):

   ```bash
   git clone https://github.com/KiroCrewCaptain/ato-2026-dup-triage.git ~/ato-2026-dup-triage
   ```

   **No git? Download ZIP:** [the repo as a ZIP](https://github.com/KiroCrewCaptain/ato-2026-dup-triage/archive/refs/heads/main.zip),
   unzip it, and use that folder (for example `~/Downloads/ato-2026-dup-triage-main`)
   wherever this handout says "your folder".

2. **Install the ATO 2026 Workshop app.** It is your guide for the rest of the session:
   **Discover** → database icon (**Manage app sources**) → **Add Registry** →
   Repo `https://github.com/KiroCrewCaptain/ato-2026-dup-triage` → **Add Registry**.
   The app list shows **ATO 2026 Workshop** → **Install** → **Trust this app
   and enable** → **Enable** on the app page. Open **ATO 2026 Workshop** in the
   sidebar and follow its steps. This path needs `git`.
   No `git`? In the same menu use **Install from Path** with the full path of the
   unzipped `ato-2026-workshop/` folder, then **Library** → **Show N disabled apps** →
   **ATO 2026 Workshop** → **⋯** → **Enable** → **Trust this app and enable**.
   Details: [ato-2026-workshop/README.md](ato-2026-workshop/README.md).

**Dry run, always.** The whole room shares this one GitHub repo, so nothing you build
today writes to it: no labels, comments, closes or pull requests. Backlog Factory reads
the issues (one unauthenticated GitHub call, or `data/issues.json` offline) and writes
only inside your folder.

### Offline fallback

`data/issues.json` holds the repo's open issues, in the shape
`gh issue list --state open --limit 200 --json number,title,body,labels` returns. The factory uses it when the
GitHub call fails. **Offline issue data does not make the model work offline.**

## The labs (about 70 minutes)

The guide app does the typing: each step button opens a chat that copies the next
checkpoint into `backlog-factory/` in your folder and installs it, after your yes.

| Lab | Time | Your app gains | You should see |
|---|---|---|---|
| 1 Sort | 25 min | the main agent, the `factory-triage` skill (good problem? → five whys → first principles), the board page and its small backend | a board with 100 cards; each has a verdict and a one-line reason |
| 2 Reproduce | 20 min | the `factory-reproduce` skill; helper agents (subagents) in batches | bugs with a real command and real output; Windows-only ones under **Needs you** |
| 3 Fix ⇄ Review | 25 min | two more agents, `factory-fixer` and `factory-reviewer`, and the `factory-fix-review` skill | one bug in **Ready to merge** with green tests; you run the merge yourself |

Then remix it (add your own rule or lane) and share it (a zip of your app folder).
Check each lab against **[answer-key.md](answer-key.md)**.

### Fell behind? Copy the next checkpoint

`checkpoints/lab-1/`, `lab-2/` and `lab-3/` are the whole `backlog-factory` app folder
as it should look at the end of each lab. macOS / Linux:

```bash
rm -rf backlog-factory && cp -R checkpoints/lab-2 backlog-factory
kirocrew app uninstall backlog-factory      # only if an older copy is installed
kirocrew app install "$PWD/backlog-factory"
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force backlog-factory -ErrorAction SilentlyContinue
Copy-Item -Recurse checkpoints\lab-2 backlog-factory
kirocrew app uninstall backlog-factory
kirocrew app install "$PWD\backlog-factory"
```

Then trust and enable it in the dashboard: **Library → Show N disabled apps →
Backlog Factory → ⋯ → Enable → Trust this app and enable**. The app has a small
backend (it serves the board), so it asks for trust. Do **not** turn on *Trust every
third-party app* in Settings. An uninstall removes the trust, so trust it again after
each reinstall. On the app's page, set **Repo folder** to your folder and press **Save**
once; it is kept across reinstalls.

## What the app may and may not do

| | Allowed |
|---|---|
| Read the open issues of `KiroCrewCaptain/ato-2026-dup-triage` (or `data/issues.json`) | yes |
| Write `factory/` in your folder: the board, repro notes, saved diffs, fix worktrees | yes, after your yes |
| Make local branches `factory/fix-<n>` | yes (Lab 3), after your yes |
| Merge a fix into your `main` | never: you do it |
| Write anything to GitHub (labels, comments, closes, PRs, pushes) | never |

**Want real writes? (after the workshop, not today.)** Fork the repo, point the
factory at your fork, and add your own "apply" step that labels or comments, behind
an explicit yes. Today's app stays a dry run.

## What is in this repo

```
README.md            this handout
ato-2026-workshop/   the ATO 2026 Workshop app: guide page + guide agent (install first)
app-registry.json    lists ato-2026-workshop, so this repo also works as a Kiro Crew app registry
answer-key.md        the expected board: bug groups, verdicts, reframes
checkpoints/         lab-1, lab-2, lab-3: the Backlog Factory app folder after each lab
data/issues.json     offline copy of the open issues
seed/issues.json     all 100 issues as written, in order (used to seed the repo)
scripts/             seed-issues.sh, refresh-offline-data.sh, build-offline-data.py
extras/dup-detective the earlier Dup Detective app (find duplicate issues), kept as an example
jot/, tests/, JOT.md the sample project the issues are about
```

## License

Apache-2.0. See [LICENSE](LICENSE). This repo is workshop material; see
[CONTRIBUTING.md](CONTRIBUTING.md).
