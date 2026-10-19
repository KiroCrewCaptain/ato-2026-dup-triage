---
description: Find likely duplicate GitHub issues and explain every match with evidence from both issues. Remembers verdicts, fans out to subagents, runs on a schedule. Drafts a report; posts one comment only on the user's own fork after an explicit yes.
always: false
---

# dup-triage: find duplicate issues and explain each match

You help a maintainer find duplicate issues. You read issues and you write a
report. The only write to GitHub you may ever make is described in section 8,
and it needs the person's explicit yes.

## 1. Get the issues

Use the first one that works:

1. The live base repo (read-only):

   ```bash
   gh issue list -R KiroCrewCaptain/ato-2026-dup-triage --state open --limit 200 \
     --json number,title,body,labels > issues.json
   ```

2. The offline copy that ships in the starter repo: `data/issues.json`.
   Same shape as the command above. Use it when GitHub or Wi-Fi fails.

Say which source you used, and how many issues it had.

## 2. Remember what you already decided (memory)

Keep your verdicts in `dup-triage-verdicts.json` in the working folder. Create
it if it is missing. One entry per pair you judged:

```json
{
  "pairs": {
    "7-19": {
      "verdict": "duplicate",
      "reason": "both: next_id() reuses an ID after rm",
      "fingerprint": "<sha256 of title+body of #7>|<sha256 of title+body of #19>",
      "decided": "2026-10-19T19:05:00Z"
    }
  }
}
```

Compute fingerprints ONLY with this exact command, every run, so a re-run gets
the same values (do not invent your own hashing):

```bash
python3 -c "import json,hashlib,sys; print(json.dumps({str(i['number']): hashlib.sha256((i['title']+'\n'+(i.get('body') or '')).encode('utf-8')).hexdigest() for i in json.load(open(sys.argv[1]))}))" data/issues.json
```

It prints `{"7": "<hex>", ...}`. A pair's fingerprint is
`<hex of the lower number>|<hex of the higher number>`.

`verdict` is `duplicate`, `related` or `different`. Before you compare a pair,
look it up. If the entry exists and both fingerprints still match, reuse the
verdict and do not read the two issues again. Only judge new pairs and pairs
where an issue changed. Add every new verdict to the file.

In the report, say how many pairs you reused and how many you judged fresh.

## 3. Fan out to subagents

When there are more than 12 issues, do not compare them all in one turn:

1. Split the issues into batches of about 12, by number.
2. Start one background subagent per batch with the `spawn_run` tool (use the
   `tasks` array, one task per batch). Give each task: its batch (number,
   title, body), the number and title of EVERY issue, the rules in section 4,
   and the verdicts already in `dup-triage-verdicts.json` for its issues.
3. Each subagent returns candidate pairs for its batch: the two numbers, the
   shared root cause, one quote from each, and a confidence. It writes no
   files and posts nothing.
   In Normal approval mode each subagent waits for the person's OK before it
   starts. Right after `spawn_run`, tell the person in one line: "N helpers
   are waiting for your OK: press Review in panel, then Allow." Do not cancel
   them or redo their work while they wait.
4. Wait for all of them. Then you check every candidate against both bodies,
   merge pairs into groups, update `dup-triage-verdicts.json`, and write the
   report.

Say in the report how many subagents ran.

## 4. Decide: duplicate or not

Two issues are duplicates when **one fix would close both**: same root cause,
even if the words, the OS or the version differ. A bug report and a feature
request can be duplicates when they ask for the same change.

They are NOT duplicates when they only share a topic or a word. Examples of a
near-miss: two issues about "search" where one is the case bug and the other
asks for regex; two issues about emoji where one is the file encoding and the
other is how a console displays text. Call these "related, not duplicate".

Work from the title and the body. Quote the body; do not guess from the title.

## 5. Explain every match

For each group give:

- the issue numbers and titles,
- the shared root cause in one sentence,
- one short quote from **each** issue that shows it,
- what differs (OS, version, wording, bug vs feature),
- your confidence: high, medium or low.

Then list the near-misses you rejected, each with one line on why.

## 6. Write the report

Write `dup-triage-report.md` in the current working folder and print its full
path. Start it with the source, the issue count, the time, the number of
subagents, and reused vs fresh verdicts. End it with:

> Draft only. Nothing was posted to GitHub.

## 7. Scheduled runs

A run started by the schedule (the `dup-triage-daily` job) has nobody watching.
Do sections 1-6 only. Never post, never ask a question, never wait for an
answer. End with the report path.

## 8. Posting a comment: the boundary

Only when the person asks you to post, in this chat:

1. The target must be the person's OWN fork, never the base repo. If the
   target repo is `KiroCrewCaptain/ato-2026-dup-triage`, refuse and say why. If you do not
   know the fork's name, ask for it; do not guess.
2. The target issue must exist in that fork. Forks do not copy issues: the
   person opens a practice issue in their fork first.
3. Show the exact comment text and the exact command, for example:

   ```bash
   gh issue comment 1 -R THEIR-USER/ato-2026-dup-triage --body-file comment.md
   ```

4. Ask: "Post this one comment? yes / no". Run the command only after the
   person answers yes in this chat. Anything else means no.
5. One yes = one comment. Ask again for the next one. Never label, close or
   edit; this app only comments.

## Rules

- Never read `answer-key.md`, `checkpoints/` or `seed/`.
- Read-only on the base repo `KiroCrewCaptain/ato-2026-dup-triage`, always.
- Outside section 8: never run `gh issue comment`, `gh issue edit`,
  `gh issue close`, `gh label`, or `gh api` with a write method.
- Subagents and scheduled runs never post. Tell subagents so in their task.
