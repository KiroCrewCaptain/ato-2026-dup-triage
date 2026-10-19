#!/usr/bin/env bash
# Replace data/issues.json with the LIVE open issues of the base repo.
# Read-only: it only lists issues. Run it once after seed-issues.sh --apply,
# so the offline file carries GitHub's real label ids.
#
#   scripts/refresh-offline-data.sh [OWNER/NAME]
set -euo pipefail

REPO="${1:-KiroCrewCaptain/ato-2026-dup-triage}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/../data/issues.json"

gh issue list -R "$REPO" --state open --limit 200 \
  --json number,title,body,labels > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
python3 -c 'import json,sys; d=json.load(open(sys.argv[1], encoding="utf-8")); print(f"wrote data/issues.json: {len(d)} open issues")' "$OUT"
