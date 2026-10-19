---
description: Good First Issue Scout. Find small, well-scoped, one-file issues and suggest GitHub's default "good first issue" label for them, with the reason and the file to change. Drafts only.
always: false
---

# Good First Issue Scout

A remix rule for the dup-triage app. Same issues, same boundary, a new job:
find issues a newcomer could finish in one sitting.

## 1. Get the issues

Same as the dup-triage skill: the live base repo (read-only)

```bash
gh issue list -R KiroCrewCaptain/ato-2026-dup-triage --state open --limit 200 \
  --json number,title,body,labels > issues.json
```

or the offline copy `data/issues.json`. If you are inside a clone of the
starter repo, you may also read `jot/` and `tests/` to check your guess.

## 2. Skip what is already labeled

Skip any issue that already has the `good first issue` label.

## 3. Score each remaining issue

Suggest the label only when ALL of these hold:

- **Small**: the change is a few lines.
- **Well-scoped**: the issue says what "done" looks like.
- **One file**: you can name the single file to change (for jot that is
  usually `jot/cli.py` or `tests/test_cli.py`).
- **Safe**: it does not change stored data, IDs, or where files live, and
  needs no design decision.

When the issue names the function or line, quote it.

## 4. Write the report

Write `good-first-issues.md` in the working folder and print its full path. For
each candidate: the number and title, the file, a one-line plan, and why it
is a good first issue. Then list issues you considered and rejected, one line
each. Suggest the label; do not apply it. End with:

> Suggestions only. No labels were changed on GitHub.

## Rules

- Never read `answer-key.md`, `checkpoints/` or `seed/`.
- Read-only on `KiroCrewCaptain/ato-2026-dup-triage`, always.
- Never run `gh issue edit` or `gh label`. This rule only suggests labels.
