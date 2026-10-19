---
name: factory-fix-review
description: Backlog Factory step 3. For a reproduced bug, the conductor makes a local worktree branch, a fixer agent writes the fix and a test, a separate reviewer agent checks the diff and runs the tests, and they loop (at most 3 rounds) until the review is GREEN. Then the card goes to Ready to merge and the person merges. Never pushes, never merges, never writes to GitHub.
---

# Fix ⇄ Review: the factory loop

Run after `factory-reproduce`. Three parts: CONDUCTOR (the backlog-factory agent), FIXER
(factory-fixer), REVIEWER (factory-reviewer). Read only the part for your role.

## CONDUCTOR (backlog-factory)

Pick cards with `lane: "fix"`. Interactive run: fix ONE card unless the person asks for
more (suggest the clearest root cause first). Scheduled run: start no fixes.

1. **Ask first.** One line: "I will make branch factory/fix-<n> in
   factory/worktrees/fix-<n> and start the fixer. OK? (yes / no)". Wait for yes.
2. **Worktree** (from the repo folder; needs git):
   `git worktree add factory/worktrees/fix-<n> -b factory/fix-<n>`.
   No git (a ZIP copy)? Stop and say: "Lab 3 needs git. Watch the presenter's demo."
3. **Fixer**: `spawn_run` with `agent: "factory-fixer"`, `keep: true`, and NO `cwd`
   (Kiro Crew 0.9.0 accepts a `cwd` only under `~/workspace`, `~/workplace` and similar
   roots, and the person's folder may be anywhere). The task holds: the worktree's
   ABSOLUTE path, "start every shell command with cd <that path> and write files only
   there", the issue text, `repro` and `details`. Tell the person in one line that the
   helper waits for their **Allow** (Subagents panel: Review in panel → Allow), then wait
   for its completion. If the named agent is refused, use the default agent and paste the
   FIXER part of this skill into the task. Never do the fixer's work yourself.
4. **Reviewer**: when the fixer is done, `spawn_run` with `agent: "factory-reviewer"`, no
   `cwd`, a NEW run each round (fresh eyes), task: the worktree's absolute path, the issue,
   `repro`, `details`, "review branch factory/fix-<n> against main". Same Allow, same
   fallback. Never review your own fix inline: the point is a second pair of eyes.
5. **Loop**: `VERDICT: CHANGES` → `spawn_continue` the SAME fixer run with the reviewer's
   notes, then a new reviewer. At most 3 rounds. Still not green after 3 → `lane: "needs_you"`,
   `needs: "stuck"`, with the last notes.
6. **Green** → save the diff: `git -C factory/worktrees/fix-<n> diff main...HEAD > factory/diffs/fix-<n>.diff`.
   Set `lane: "ready"`, `status: "review green"`, and `fix.merge_cmd: "git merge factory/fix-<n>"`.
7. After every round, update the card. `rounds` gets one entry per round (stat from
   `git diff --shortstat main...HEAD`, the reviewer's verdict and first note) and `tests`
   the unittest count; the page draws them:

```json
"fix": {
  "branch": "factory/fix-32",
  "worktree": "factory/worktrees/fix-32",
  "rounds": [
    {"n": 1, "stat": "+3 -1", "verdict": "changes", "note": "empty file not covered"},
    {"n": 2, "stat": "+9 -1", "verdict": "green", "note": "tests 9/9"}
  ],
  "tests": "9/9",
  "diff_file": "factory/diffs/fix-32.diff",
  "merge_cmd": "git merge factory/fix-32"
}
```

   While a round runs: `lane: "fix"`, `status: "fixing · round 1"` or `"review · round 2"`.

**Never merge.** The person reads the diff on the page and runs `merge_cmd` themselves.
If asked to merge, say: "You merge. Run: git merge factory/fix-<n>". Never push.

## FIXER (factory-fixer)

- Work only in the worktree path you were given (`cd` into it first). Check `git branch --show-current` is
  `factory/fix-<n>` before you write.
- Fix the ROOT cause from `details`, not the symptom. Smallest change. No new dependency.
- Add a unittest in `tests/` that fails without your change and passes with it.
- Run `python -m unittest discover -s tests` (all tests). Commit: `factory: fix #<n> (<root cause>)`.
- With reviewer notes: address every note, run the tests again, commit again.
- Reply: files changed, the unittest result line, one sentence on the fix.

## REVIEWER (factory-reviewer)

You are the outsider. You did not write this.
- `git diff main...HEAD` in the worktree. Run `python -m unittest discover -s tests`. Re-run the `repro` commands
  with a throwaway `JOT_FILE`.
- Ask: does it remove the root cause? Is this the right problem (not just the reported
  symptom)? Smallest good change? Would the new test have caught the bug?
- First line exactly `VERDICT: GREEN` or `VERDICT: CHANGES`. Then at most 3 numbered notes,
  one line each. Do not edit files.

## Never, in any role

GitHub writes (comment, label, close, PR, push), `git merge`, `git push`, changes on `main`,
changes outside the worktree (fixer) or any change (reviewer).
