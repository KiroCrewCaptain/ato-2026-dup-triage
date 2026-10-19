---
description: Missing-Info Nudger. Find bug reports that lack a version, an OS or steps to reproduce, and draft a short, friendly reply asking for exactly what is missing. Drafts only.
always: false
---

# Missing-Info Nudger

A remix rule for the dup-triage app. Same issues, same boundary, a new job:
find bug reports a maintainer cannot act on yet, and draft the nudge.

## 1. Get the issues

Same as the dup-triage skill: the live base repo (read-only)

```bash
gh issue list -R KiroCrewCaptain/ato-2026-dup-triage --state open --limit 100 \
  --json number,title,body,labels > issues.json
```

or the offline copy `data/issues.json`.

## 2. Pick the bug reports

An issue is a bug report when it is labeled `bug`, or when it is unlabeled and
says something is broken, wrong, slow or crashing. Skip feature requests,
questions and docs.

## 3. Check three things

For each bug report, check the body for:

- **Version**: a jot version (`jot 0.3.1`) or `jot --version` output.
- **OS**: macOS, Windows, Linux, or a distribution name.
- **Steps**: the exact command run, or a traceback / error text.

A report is missing info when two or more of the three are absent. One
missing item is a judgment call: list it under "maybe" instead.

## 4. Draft the nudge

For each report missing info, draft one reply:

- Thank them in one line.
- Ask for exactly what is missing, nothing else, as a short list.
- Show them how: `jot --version`, the OS name, the command and the full error.
- No blame, no "please read the template".

## 5. Write the report

Write `missing-info-report.md` in the working folder and print its full path:
one section per issue with what is missing and the draft reply, then the
"maybe" list. End with:

> Draft only. Nothing was posted to GitHub.

## Rules

- Never read `answer-key.md`, `checkpoints/` or `seed/`.
- Read-only on `KiroCrewCaptain/ato-2026-dup-triage`, always.
- Posting a draft follows section 8 of the dup-triage skill: the person's own
  fork only, the exact command shown, one comment per explicit yes, never in a
  scheduled run.
