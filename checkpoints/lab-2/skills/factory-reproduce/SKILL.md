---
name: factory-reproduce
description: Backlog Factory step 2. For each bug in the reproduce lane, reproduce it for real in the local clone (exact commands plus real output, or a failing unittest), add the five-whys root cause as "details added", and move it to fix, needs_you or needs_info. Uses two helper agents. Use after triage, or when asked to reproduce bugs.
---

# Reproduce: prove each bug before anyone fixes it

Run after `factory-triage`. Work on cards with `lane: "reproduce"` in `<repo>/factory/board.json`.
Skip a card that already has `repro.result` (the board is the memory: a re-run only does
new work). Duplicates are not reproduced: only the card they point to (`dup_of`).

**Every tool call costs the person one click in Normal mode. Aim for about 10 clicks for
the whole step.** So: read the board once, ask once, start the helpers in ONE `spawn_run`
call, write the board once at the end.

## Rules

1. Never touch the person's real notes. Every command runs with a throwaway file:
   `JOT_FILE=<repo>/factory/tmp/<n>.json python3 -m jot ...` from the repo folder.
   (`py` or `python` on Windows.)
2. Run the real commands. Paste the real output. Never invent output. If a command
   cannot run here (another OS, a missing tool), the verdict is `cant_reproduce` and the
   card says what is needed.
3. The evidence is the jot command and its real output. No unit tests in this step (the
   Lab 3 fixer writes the test). Do not edit `jot/` or `tests/`.
4. GitHub stays read only. Nothing in this step talks to the network.

## The step, in order

1. **Read once.** One shell call prints, for each reproduce card: `n`, title, the issue
   body, and the card's `frame.root` (from triage). That is everything the helpers need:
   do not read `jot/cli.py` yourself, and after the yes do not read the board or this
   skill again.
2. **Ask once.** "I will start 2 helpers: #a #b #c … and #x #y #z …, then write
   board.json once at the end. OK? (yes / no)". Batches are big on purpose (fewer
   clicks): 1 helper for up to 3 bugs, 2 helpers for up to 12, 3 helpers above that.
   That one yes covers the helpers AND the final board write: do not ask again, and do not
   re-read files you already read in this chat.
3. **Start the helpers in ONE `spawn_run` call, and never pass `cwd`** (0.9.0 refuses it for
   this folder, and each refused spawn costs the person two more clicks). Use a `tasks` list (one task per helper) with
   `agent: "factory-reproducer"` for each (a `cwd` is accepted only under `~/workspace`,
   `~/workplace` and similar roots; the repo may be anywhere).
   Each task holds: the repo's ABSOLUTE path, its bugs (number, title, body, root), and
   the line "Do your WHOLE batch in ONE shell call (see your prompt)."
   Tell the person in one line: "Each helper waits for your **Allow** (Review in panel →
   Allow): 2 clicks to start, then about 1 click each."
4. **Wait for every completion event.** A helper's completion is final, whatever its
   status. For each helper:
   - came back `completed` with JSON → use the JSON from its completion event as it is
     (do not open its result file, do not re-run its commands);
   - shows **Stopped**, failed, cancelled, timed out, or ended with no result →
     `spawn_continue` it ONCE with "Finish your batch: one shell call, then the JSON";
   - if that fails again → do ITS batch yourself right away, in ONE shell call (same
     script shape as the helper), and say "Helper 2 stopped twice, so I did #x #y #z
     myself."
   **Never end your turn waiting for a helper.** If no helper is still running, carry on
   to step 5 in the same turn.

5. **Write the board once**, with ONE shell call from the repo folder that runs exactly
   this script, with the helpers' JSON lists pasted in. Never edit cards one by one with
   the file tool (each edit is a click). Then report.

```bash
python3 - <<'PY'
import json
p = "factory/board.json"; b = json.load(open(p, encoding="utf-8"))
results = []          # paste helper 1's JSON list here, then: results += [ ...helper 2... ]
cards = {c["n"]: c for c in b["issues"]}
for r in results:
    c = cards[r["n"]]
    c["repro"] = {"cmd": r["cmd"], "out": r["out"], "note": r.get("note", ""),
                  "result": r["result"], "where": "your clone"}
    c["details"] = "Cause: " + r["root"]
    if r["result"] == "reproduced":
        c.update(lane="fix", status="reproduced", track=["sorted", "reproduced", "details"])
    elif r["result"] == "cant_reproduce":
        c.update(lane="needs_you", needs="cant_reproduce", status="can't reproduce here",
                 reply=r.get("note", ""))
    else:
        c.update(lane="triage", kind="feature", status="works as designed", verdict="reframe")
b["run"] = {"state": "idle", "step": "reproduce done"}
json.dump(b, open(p, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(len(results), "cards updated")
PY
```

If `spawn_run` is not in your tools at all, skip steps 3-4 and do both batches yourself,
one shell call each.

## What to write per card

```json
"repro": {
  "cmd": "jot add a; jot add b; jot add c; jot rm 2; jot add d; jot list",
  "out": "1  a\n3  c\n3  d",
  "note": "same ID as c",
  "result": "reproduced",
  "where": "your clone"
},
"details": "Cause: next_id() returns len(notes) + 1. Any version. Any OS."
```

Then set:
- reproduced → `lane: "fix"`, `status: "reproduced"`, `track: ["sorted","reproduced","details"]`
- not reproducible here → `lane: "needs_you"`, `needs: "cant_reproduce"`, a one-line
  `reply` the person could send the reporter (they copy it; you never post it)
- works as designed → set `lane: "triage"` as a feature with a `frame`, verdict `reframe`

At the end: `run.step = "reproduce done"`, `run.state = "idle"`.

## Report

A table: issue → reproduced? → root cause (one line). Then the click count if you know it,
and: "Next: the fix-review step."
