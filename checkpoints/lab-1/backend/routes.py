"""Backlog Factory: the page's tiny backend (in-gateway route hook).

The factory agent keeps everything in the repo folder, under factory/:
  factory/board.json      the board the page draws
  factory/decisions.json  your clicks on the page (Build / Reframe / Needs you)
  factory/diffs/*.diff    the reviewer's saved diff for each fix branch

This module only READS those files, and writes decisions.json and the saved
repo folder. It never runs git, never calls GitHub, never runs a model.

Routes (under /api/apps/backlog-factory/):
  GET  /settings   -> {"repo": "...", "board_path": "..."}
  POST /settings   {"repo": "~/ato-2026-dup-triage"}
  GET  /board      -> factory/board.json (or {"empty": true, ...})
  GET  /diff?n=32  -> factory/diffs/fix-32.diff as text
  POST /decide     {"n": 14, "choice": "build"} -> factory/decisions.json
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from aiohttp import web
from kiro_crew.apps.route_registry import AppRoute

DEFAULT_REPO = "~/ato-2026-dup-triage"
CHOICES = {"build", "reframe", "as_asked", "needs_you", "reject", "agree", "park", "send_back", "due_dates_only"}
MAX_BYTES = 2_000_000


def _settings_file(ctx) -> Path:
    return Path(ctx.data_dir) / "settings.json"


def _repo(ctx) -> Path:
    try:
        raw = json.loads(_settings_file(ctx).read_text(encoding="utf-8")).get("repo") or DEFAULT_REPO
    except (OSError, ValueError):
        raw = DEFAULT_REPO
    return Path(os.path.expanduser(str(raw))).resolve()


def _factory(ctx) -> Path:
    return _repo(ctx) / "factory"


def _atomic_write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".tmp-", suffix=path.suffix)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(text)
    os.replace(tmp, path)


def _read_json(path: Path):
    if not path.is_file() or path.stat().st_size > MAX_BYTES:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


async def get_settings(request: web.Request, ctx) -> web.Response:
    return web.json_response({
        "repo": str(_repo(ctx)),
        "board_path": str(_factory(ctx) / "board.json"),
        "repo_exists": _repo(ctx).is_dir(),
        "settings_file": str(_settings_file(ctx)),
    })


async def post_settings(request: web.Request, ctx) -> web.Response:
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "send JSON"}, status=400)
    repo = str(body.get("repo") or "").strip()
    if not repo or len(repo) > 500 or "\x00" in repo:
        return web.json_response({"error": "repo folder missing"}, status=400)
    _atomic_write(_settings_file(ctx), json.dumps({"repo": repo}, indent=2))
    return await get_settings(request, ctx)


async def get_board(request: web.Request, ctx) -> web.Response:
    board = _read_json(_factory(ctx) / "board.json")
    if not isinstance(board, dict):
        return web.json_response({"empty": True, "repo": str(_repo(ctx)), "repo_exists": _repo(ctx).is_dir()})
    decisions = _read_json(_factory(ctx) / "decisions.json")
    board["decisions"] = decisions if isinstance(decisions, dict) else {}
    board["repo_dir"] = str(_repo(ctx))
    return web.json_response(board)


async def get_diff(request: web.Request, ctx) -> web.Response:
    n = request.query.get("n", "")
    if not re.fullmatch(r"\d{1,6}", n):
        return web.json_response({"error": "n must be an issue number"}, status=400)
    path = _factory(ctx) / "diffs" / f"fix-{n}.diff"
    if not path.is_file() or path.stat().st_size > MAX_BYTES:
        return web.json_response({"error": f"no saved diff for #{n} yet"}, status=404)
    return web.Response(text=path.read_text(encoding="utf-8", errors="replace"), content_type="text/plain")


async def post_decide(request: web.Request, ctx) -> web.Response:
    try:
        body = await request.json()
    except ValueError:
        return web.json_response({"error": "send JSON"}, status=400)
    n, choice = body.get("n"), str(body.get("choice") or "")
    if not isinstance(n, int) or n < 1 or choice not in CHOICES:
        return web.json_response({"error": "need n (issue number) and a known choice"}, status=400)
    path = _factory(ctx) / "decisions.json"
    decisions = _read_json(path)
    if not isinstance(decisions, dict):
        decisions = {}
    decisions[str(n)] = {"choice": choice, "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    _atomic_write(path, json.dumps(decisions, indent=2))
    return web.json_response({"ok": True, "n": n, "choice": choice})


def register_routes(ctx) -> list[AppRoute]:
    return [
        AppRoute("GET", "/settings", get_settings),
        AppRoute("POST", "/settings", post_settings),
        AppRoute("GET", "/board", get_board),
        AppRoute("GET", "/diff", get_diff),
        AppRoute("POST", "/decide", post_decide),
    ]
