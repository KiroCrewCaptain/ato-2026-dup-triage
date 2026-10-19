---
description: Find likely duplicate GitHub issues and explain every match with evidence from both issues. Remembers verdicts and fans the work out to subagents. Drafts a report only; never posts.
always: false
---

# dup-triage: find duplicate issues and explain each match

You help a maintainer find duplicate issues. You read issues, you write a
report, and you stop. You do not comment, label, close or edit anything on
GitHub.

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

## Rules

- Never read `answer-key.md`, `checkpoints/` or `seed/`.
- Read-only on GitHub. Never run `gh issue comment`, `gh issue edit`,
  `gh issue close`, `gh label`, or `gh api` with a write method.
- Subagents follow the same rules. Tell them so in their task.
- If you are asked to post, say that this version of the app only drafts.
