# ATO 2026 Workshop app

The guide for the All Things Open 2026 workshop "Build Your First Kiro Crew
App" (Mon Oct 19, 2:30–4:30 PM ET, Room 304). Install it first. Its page walks
you through building your own app, and its guide agent does the typing.

## Install (Kiro Crew Stable 0.9.0)

**From GitHub (main path, about 20 seconds, no GitHub sign-in, needs `git`):**

1. In Kiro Crew: **Discover** → the database icon at the top right
   (**Manage app sources**) → **Add Registry**.
2. Repo: `https://github.com/KiroCrewCaptain/ato-2026-dup-triage` → **Add Registry**.
3. The app list shows **ATO 2026 Workshop** → **Install**.
4. The trust dialog opens before anything is downloaded → **Trust this app and enable**.
5. The app page opens with "Install complete" → **Enable**.
   **ATO 2026 Workshop** now shows in the sidebar. Open it.

**Fallback: Install from Path** (no `git`, or GitHub blocked):

1. Get the repo onto the laptop: clone your fork, or **Code → Download ZIP** and unzip.
2. **Discover** → database icon → **Install from Path** → paste the full path of
   this folder, for example `/Users/you/ato-2026-dup-triage/ato-2026-workshop`
   → **Install**.
3. **Library** → **Show N disabled apps** → **ATO 2026 Workshop** → **⋯** →
   **Enable** → **Trust this app and enable**.

Terminal instead of fallback step 2: `kirocrew app install "$PWD/ato-2026-workshop"`
(run from your clone). You still trust and enable it in the dashboard.

You still need your own fork and clone for the labs: the guide builds your app there.

## What is inside

| Path | What it is |
|---|---|
| `app.json` | The app: id `ato-2026-workshop`, one agent, one skill, one page. No backend, no schedule. |
| `agents/workshop-guide.json` | The guide agent. File and shell tools only. |
| `skills/workshop-guide/SKILL.md` | The guide's rules and the seven steps. |
| `ui/src/App.tsx` | The page source. |
| `ui/dist/` | The pre-built page, its fonts (OFL), logos and Kiro Crew ghosts. Works offline. |

## What the guide will and won't do

- It types for you: copies the lab checkpoint into `dup-triage/`, writes your
  remix skill, runs `kirocrew app install`.
- It asks **yes / no** before every file change, install or commit.
- It never writes to GitHub: no push, no comments, no issues or PRs.
- It never trusts or enables an app. You do that in **Library**.

## Rebuild the page (optional)

Needs Node.js. From `ui/`: `npm install && npm run build`, then reinstall.

## Where the art comes from

- Ghost poses (`ui/dist/assets/ghosts/`): from
  [kirodotdev/KiroCrew](https://github.com/kirodotdev/KiroCrew) v0.9.0
  (`website/src/assets/`), Apache-2.0. Unchanged.
- `ui/dist/assets/kirocrew-icon.png`: the Kiro Crew app icon (the same file the
  workshop deck uses). `assets/icon.png` is this app's own tile: a v0.9.0 ghost
  pose on an ATO-red to Kiro-purple gradient.
- ATO 2026 logos: the event's original files, unchanged (colour and ratio kept).
- Fonts: Space Grotesk and JetBrains Mono, SIL Open Font License (texts beside them).
