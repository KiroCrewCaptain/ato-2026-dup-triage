# Build Your First Kiro Crew App: dup-triage

Starter repo for the All Things Open 2026 workshop
**"Build Your First Kiro Crew App: An Agent That Triages Your Backlog While You Sleep"**
(Mon Oct 19, 2:30–4:30 PM ET, Room 304).

In two hours you build `dup-triage`, a [Kiro Crew](https://github.com/kirodotdev/KiroCrew)
app that finds duplicate GitHub issues and explains each match. It remembers
its verdicts, fans the work out to subagents, runs on a schedule, and never
writes to GitHub without your yes. Everything happens in the room. Nothing is
left over for later.

The issues come from `jot`, a tiny notes CLI in this repo (`jot/`, `JOT.md`).
They are the kind every open-source maintainer gets: the same bug in different
words, from different OSes and versions.

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
   your browser, then press **Check sign-in again**. Use the command exactly
   as the page shows it; do not type your own path.
3. **Sign GitHub in, read-only.** Create a fine-grained personal access token
   (GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens) with **Public repositories** read-only access. Then:

   ```bash
   gh auth login --with-token     # paste the token, then press Ctrl-D
   gh auth status
   ```

4. **Optional: Node.js 24 LTS.** Only needed to rebuild the Lab 3 page. The
   page ships pre-built, so you can skip this.

## Start here (first 5 minutes)

1. **Fork** this repo on GitHub.
2. **Clone your fork** and go into it:

   ```bash
   git clone https://github.com/YOUR-USER/ato-2026-dup-triage.git
   cd ato-2026-dup-triage
   ```

3. **Open it** in Kiro Crew: start a dashboard chat with this folder as its
   project folder.
4. **Install the ATO 2026 Workshop app** from this repo. It is your guide for
   the rest of the session:
   **Discover** → database icon (**Manage app sources**) → **Install from
   Path** → the full path of `ato-2026-workshop/` in your clone → **Install**.
   Then **Library** → **Show N disabled apps** → **ATO 2026 Workshop** → **⋯**
   → **Enable** → **Trust this app and enable**. Open **ATO 2026 Workshop** in
   the sidebar and follow its steps. Details: [ato-2026-workshop/README.md](ato-2026-workshop/README.md).

### Read this once: forks do not copy issues

GitHub forks copy code, not issues. So:

- The app **reads** issues from the base repo `KiroCrewCaptain/ato-2026-dup-triage`
  (public, read-only for you), or from `data/issues.json` in your clone.
- You never write to the base repo.
- To practice posting a comment, open your own issue in **your fork**. Turn
  Issues on first: your fork → Settings → General → Features → Issues. The
  app posts only there, and only after you approve it.

### Offline fallback

`data/issues.json` is the base repo's issues, in exactly the shape
`gh issue list --limit 100 --json number,title,body,labels` returns. Use it when Wi-Fi or
GitHub is slow.

**Offline issue data does not make the model work offline.** The agent still
needs the internet to reach the model.

To fetch the live issues (all of them; the default limit is 30):

```bash
gh issue list -R KiroCrewCaptain/ato-2026-dup-triage --state open --limit 100 \
  --json number,title,body,labels > issues.json
```

## The labs

Each lab follows the slides. When you finish a lab, compare your report with
**[answer-key.md](answer-key.md)**. That is the Check step.

### Lab 1: Find duplicates and explain each match (2:55–3:30 PM ET)

Scaffold the app with `kirocrew app init dup-triage --cron`, write the skill,
install it, and get a report that explains every match. See the slides.

### Lab 2: Memory and background subagents (3:40–4:00 PM ET)

Make it remember verdicts and fan the work out to subagents. See the slides.

### Lab 3: Schedule, permission boundary, and a page (4:00–4:18 PM ET)

Put it on a schedule, add the approval boundary, add its page. See the slides.

### Fell behind? Copy the next checkpoint

`checkpoints/lab-1/`, `lab-2/` and `lab-3/` are the whole `dup-triage` app
folder as it should look at the end of each lab. Each has a README with its
install steps. macOS / Linux:

```bash
rm -rf dup-triage && cp -R checkpoints/lab-2 dup-triage
kirocrew app uninstall dup-triage      # only if an older copy is installed
kirocrew app install "$PWD/dup-triage"
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force dup-triage -ErrorAction SilentlyContinue
Copy-Item -Recurse checkpoints\lab-2 dup-triage
kirocrew app uninstall dup-triage
kirocrew app install "$PWD\dup-triage"
```

Then trust and enable it in the dashboard: **Apps → Library → Show N disabled
apps → Dup Detective → ⋯ → Enable → Trust this app and enable**. Do **not** turn on
*Trust every third-party app* in Settings: that admits every third-party app,
not just this one. (Settings → Security → Third-party apps is where you remove
trust later.) An uninstall removes the trust, so trust it again after each
reinstall. If the app is already trusted, `kirocrew app enable dup-triage`
enables it from the terminal.

### Finished early? Remix your app

Give your app a second rule. Two are ready in `checkpoints/remix/skills/`:

- **Missing-Info Nudger** (`missing-info-nudger/`): finds bug reports with no
  version, OS or steps, and drafts a friendly reply asking for exactly what is
  missing.
- **Good First Issue Scout** (`good-first-issue-scout/`): finds small,
  one-file issues and suggests GitHub's `good first issue` label.

To add one: copy its folder into `dup-triage/skills/`, add its path to
`"skills"` in `dup-triage/app.json` (for example
`"skills/missing-info-nudger"`), then reinstall, trust and enable as above. No agent edit: the agent's
`"resources"` line already maps every skill in the app.
`answer-key.md` lists the expected issues for both.

## What the app may and may not do

| | Allowed |
|---|---|
| Read issues from `KiroCrewCaptain/ato-2026-dup-triage` or `data/issues.json` | yes |
| Write `dup-triage-report.md` and `dup-triage-verdicts.json` on your machine | yes |
| Write anything to `KiroCrewCaptain/ato-2026-dup-triage` | never |
| Post from a scheduled run | never |
| Post one comment on an issue in **your fork** | only after it shows you the command and you say yes |

Your read-only token from the pre-work cannot post at all. To try posting on
your fork, make a second fine-grained token for **only your fork** with
**Issues: Read and write**.

## What is in this repo

```
README.md            this handout
ato-2026-workshop/   the ATO 2026 Workshop app: guide page + guide agent (install first)
app-registry.json    lists ato-2026-workshop, so this repo also works as a Kiro Crew app registry
answer-key.md        expected duplicate groups, near-misses, remix lists
data/issues.json     offline copy of the base repo's open issues
seed/issues.json     the issues as written (used to seed the base repo)
scripts/             seed-issues.sh, refresh-offline-data.sh, build-offline-data.py
checkpoints/         lab-1, lab-2, lab-3 app folders; remix/skills
jot/, tests/, JOT.md the sample project the issues are about
```

## License

Apache-2.0. See [LICENSE](LICENSE). This repo is workshop material; see
[CONTRIBUTING.md](CONTRIBUTING.md).
