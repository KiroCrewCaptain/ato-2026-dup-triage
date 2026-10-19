// src/App.tsx
import { useAppApi, useChatLauncher, useNotify, useTheme } from "@kirocrew/app-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var APP = "backlog-factory";
var AGENT = "backlog-factory";
var API = `/api/apps/${APP}`;
var asset = (f) => new URL(`./assets/${f}`, import.meta.url).href;
var LANES = [
  { id: "inbox", label: "Inbox" },
  { id: "triage", label: "Triage" },
  { id: "reproduce", label: "Reproduce" },
  { id: "fix", label: "Fix \u21C4 Review" },
  { id: "ready", label: "Ready to merge", tone: "green" },
  { id: "needs_you", label: "Needs you", tone: "gold" }
];
var KNOWN = /* @__PURE__ */ new Set(["inbox", "triage", "reproduce", "fix", "ready", "needs_you", "rejected", "duplicate"]);
var ALIAS = {
  "factory-triage": "triage",
  "factory-reproduce": "reproduce",
  "factory-fix-review": "fix",
  docs: "triage",
  build: "triage",
  reframe: "triage",
  review: "fix",
  fixing: "fix",
  "in_review": "fix",
  "needs-you": "needs_you",
  needs_info: "needs_you",
  reject: "rejected",
  dup: "duplicate"
};
function laneOf(c) {
  const raw = String(c.lane || "inbox").trim().toLowerCase();
  if (KNOWN.has(raw)) return raw;
  return ALIAS[raw] || "inbox";
}
var TABS = ["Board", "Bugs", "Features", "Needs you"];
function isLight(sdkMode) {
  const r = typeof document !== "undefined" ? document.documentElement.dataset.mode : "";
  if (r === "light" || r === "dark") return r === "light";
  return /light/.test(sdkMode || "");
}
var reduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var issueUrl = (repo, n) => `https://github.com/${repo || "KiroCrewCaptain/ato-2026-dup-triage"}/issues/${n}`;
var CSS = `
@font-face{font-family:"BF Space Grotesk";font-weight:400 700;font-display:swap;src:url("${asset("fonts/SpaceGrotesk-latin.woff2")}") format("woff2")}
@font-face{font-family:"BF JetBrains Mono";font-weight:400 500;font-display:swap;src:url("${asset("fonts/JetBrainsMono-latin.woff2")}") format("woff2")}
.bf{--red:#EA3A40;--kc:#8E48FF;--green:#3ddc84;--gold:#f2c94c;--sans:"BF Space Grotesk","Space Grotesk",system-ui,sans-serif;--mono:"BF JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;
  --e:cubic-bezier(.16,1,.3,1);--over:cubic-bezier(.34,1.45,.64,1);height:100%;overflow-y:auto;font-family:var(--sans);font-size:16px;line-height:1.45;-webkit-font-smoothing:antialiased}
.bf[data-mode=dark]{--bg:#0e0b14;--ink:#f1edf7;--muted:#b4abc4;--card:#17121f;--card2:#1d1727;--line:#2e2739;--chip:#272033;--red-t:#ff7a7f;--kc-t:#c4a6ff;--green-t:#5be59a;--gold-t:#f5d36b;--code:#0b0910}
.bf[data-mode=light]{--bg:#f7f4fb;--ink:#1b1225;--muted:#4f4560;--card:#ffffff;--card2:#faf8fd;--line:#ddd5e8;--chip:#efe9f6;--red-t:#b8283d;--kc-t:#6a2fd6;--green-t:#137a43;--gold-t:#8a6100;--code:#f3eff8}
.bf{background:var(--bg);color:var(--ink)}
.bf[data-mode=dark]{background:radial-gradient(900px 400px at 85% -10%,#3a1430 0%,transparent 60%),radial-gradient(700px 400px at 0% 0%,#24133d 0%,transparent 60%),var(--bg)}
.bf *{box-sizing:border-box}
.bf a{color:var(--kc-t);text-underline-offset:3px}
.bf :focus-visible{outline:3px solid var(--kc-t);outline-offset:2px;border-radius:8px}
.bf .wrap{padding:22px 28px 40px;max-width:1600px;margin:0 auto}
.bf .rule{height:4px;border-radius:4px;background:linear-gradient(90deg,var(--red),var(--kc));transform-origin:left;margin-bottom:16px}
.bf .top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}
.bf .crumb{font-size:15px;color:var(--muted)}
.bf h1{font-size:34px;margin:2px 0 14px;letter-spacing:-.01em}
.bf .right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.bf .brand{display:flex;align-items:center;gap:10px}
.bf .brand img.ato{height:30px;width:auto}
.bf .brand img.kc{height:30px;width:30px;border-radius:7px}
.bf[data-mode=light] .brand img.ato{background:#140b15;border-radius:6px;padding:3px 6px}
.bf .pill{font:500 13px var(--mono);border:1px solid var(--line);border-radius:999px;padding:4px 12px;color:var(--muted)}
.bf .pill.ok{border-color:var(--green-t);color:var(--green-t)}
.bf button{font:600 15px var(--sans);border-radius:10px;border:1px solid var(--line);background:var(--card2);color:var(--ink);padding:8px 14px;cursor:pointer;transition:transform .2s var(--e),border-color .2s}
.bf button:hover{border-color:var(--kc)}
.bf button:active{transform:scale(.97)}
.bf button.go{border:0;color:#fff;background:linear-gradient(90deg,#d4283f,#8E48FF)}
.bf button[aria-pressed=true]{outline:2px solid var(--green-t)}
.bf .stats{display:flex;gap:12px;flex-wrap:wrap;margin:6px 0 18px}
.bf .stat{min-width:118px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px}
.bf .stat b{display:block;font-size:34px;line-height:1.05}
.bf .stat span{font-size:14px;color:var(--muted)}
.bf .stat.red{border-color:var(--red)} .bf .stat.red b{color:var(--red-t)}
.bf .stat.kc b{color:var(--kc-t)} .bf .stat.gold{border-color:var(--gold)} .bf .stat.gold b{color:var(--gold-t)} .bf .stat.green b{color:var(--green-t)}
.bf .tabs{display:flex;gap:6px;margin:0 0 14px;border-bottom:1px solid var(--line)}
.bf .tabs button{border:0;border-bottom:3px solid transparent;border-radius:0;background:none;padding:10px 14px;color:var(--muted)}
.bf .tabs button[aria-selected=true]{color:var(--ink);border-bottom-color:var(--red)}
.bf .lanes{display:grid;grid-template-columns:repeat(6,minmax(150px,1fr));gap:10px;overflow-x:auto}
.bf .lane{background:color-mix(in srgb,var(--card) 70%,transparent);border:1px solid var(--line);border-radius:12px;padding:8px;min-height:420px}
.bf .lane.green{border-color:var(--green-t)} .bf .lane.gold{border-color:var(--gold)}
.bf .lane h3{display:flex;justify-content:space-between;gap:6px;font:700 12px var(--mono);letter-spacing:.06em;text-transform:uppercase;margin:2px 4px 10px}
.bf .lane.green h3{color:var(--green-t)} .bf .lane.gold h3{color:var(--gold-t)}
.bf .card{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:9px;transition:transform .25s var(--over),border-color .2s,box-shadow .2s}
.bf .card:hover,.bf .card:focus-within{transform:translateY(-2px);border-color:var(--kc);box-shadow:0 10px 30px -18px var(--kc)}
.bf .card.hot{border-color:var(--red)}
.bf .num{font:500 12px var(--mono);color:var(--muted)}
.bf .t{font-weight:600;font-size:15px;line-height:1.3;margin:2px 0 6px;overflow-wrap:anywhere}
.bf .chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px}
.bf .chip{font:500 12px var(--mono);padding:1px 7px;border-radius:5px;background:var(--chip);color:var(--muted)}
.bf .chip.bug{color:var(--red-t)} .bf .chip.feature{color:var(--kc-t)} .bf .chip.g{color:var(--green-t)} .bf .chip.y{color:var(--gold-t)}
.bf .why{font-size:14px;color:var(--muted);overflow-wrap:anywhere}
.bf .foot{display:flex;justify-content:space-between;color:var(--muted);font-size:14px;margin-top:14px;flex-wrap:wrap;gap:10px}
.bf .rv{animation:bf-rise .5s var(--e) backwards;animation-delay:calc(var(--i,0) * 40ms)}
.bf.enter .rule{animation:bf-draw .7s var(--e) both}
.bf.enter .stat{animation:bf-rise .5s var(--e) backwards;animation-delay:calc(var(--i,0) * 60ms)}
@keyframes bf-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes bf-draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.bf .empty{background:var(--card);border:1px dashed var(--line);border-radius:14px;padding:28px;max-width:820px}
.bf .empty h2{margin:0 0 8px}
.bf .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.bf input.repo{font:500 15px var(--mono);padding:8px 10px;border-radius:9px;border:1px solid var(--line);background:var(--card2);color:var(--ink);min-width:320px}
.bf .two{display:grid;grid-template-columns:minmax(260px,320px) 1fr;gap:16px}
.bf .list button{display:block;width:100%;text-align:left;margin-bottom:6px}
.bf .list button[aria-current=true]{border-color:var(--red)}
.bf .panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px}
.bf .track{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}
.bf .track span{font-size:14px;border:1px solid var(--line);border-radius:8px;padding:5px 10px;color:var(--muted)}
.bf .track span.done{border-color:var(--green-t);color:var(--green-t)} .bf .track span.now{border-color:var(--red);color:var(--red-t)}
.bf pre{font:14px/1.5 var(--mono);background:var(--code);border:1px solid var(--line);border-radius:10px;padding:12px;overflow:auto;white-space:pre-wrap;margin:6px 0}
.bf .h{font:700 13px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px}
.bf .rounds div{display:flex;gap:10px;align-items:baseline;border-top:1px solid var(--line);padding:8px 0}
.bf .ok{color:var(--green-t);font-weight:700} .bf .no{color:var(--red-t);font-weight:700}
.bf .ready{border:1px solid var(--green-t);border-radius:12px;padding:14px;margin-top:12px}
.bf .feats{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.bf .feat{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.bf .feat .step{border-top:1px solid var(--line);padding:8px 0}
.bf .feat .step b{font:700 12px var(--mono);letter-spacing:.06em;color:var(--muted);text-transform:uppercase}
.bf .root{color:var(--gold-t);font-weight:700}
.bf .verdict{margin-top:auto;border-radius:12px;padding:12px;border:1px solid var(--line)}
.bf .verdict.build{border-color:var(--green-t)} .bf .verdict.reframe{border-color:var(--red)} .bf .verdict.needs_you{border-color:var(--gold)} .bf .verdict.reject{border-color:var(--muted)}
.bf .verdict h4{margin:0 0 4px;font-size:18px}
.bf .verdict.build h4{color:var(--green-t)} .bf .verdict.reframe h4{color:var(--red-t)} .bf .verdict.needs_you h4{color:var(--gold-t)}
.bf .needs > div{display:grid;grid-template-columns:150px 1fr auto;gap:14px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:10px}
.bf .needs .k{font:700 13px var(--mono);letter-spacing:.06em}
.bf .modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:50}
.bf .modal > div{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;width:min(900px,92vw);max-height:84vh;overflow:auto}
.bf .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (prefers-reduced-motion: reduce){.bf *,.bf *::before{animation:none!important;transition:none!important}}
`;
function Chips({ c }) {
  return /* @__PURE__ */ jsxs("div", { className: "chips", children: [
    c.kind && /* @__PURE__ */ jsx("span", { className: `chip ${c.kind}`, children: c.kind }),
    c.size && /* @__PURE__ */ jsx("span", { className: "chip", children: c.size === "product" ? "product" : c.size }),
    c.status && /* @__PURE__ */ jsx("span", { className: `chip ${/green|reproduced/.test(c.status) ? "g" : /round|fixing|review/.test(c.status) ? "y" : ""}`, children: c.status }),
    c.dup_of && /* @__PURE__ */ jsxs("span", { className: "chip", children: [
      "dup of #",
      c.dup_of
    ] }),
    c.lane && !KNOWN.has(String(c.lane).trim().toLowerCase()) && /* @__PURE__ */ jsxs("span", { className: "chip y", title: "This lane is not one the board knows", children: [
      "lane: ",
      c.lane
    ] })
  ] });
}
function BacklogFactory() {
  const api = useAppApi();
  const notify = useNotify();
  const theme = useTheme();
  const { openChat } = useChatLauncher();
  const [board, setBoard] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("Board");
  const [repo, setRepo] = useState("");
  const [pick, setPick] = useState(null);
  const [diff, setDiff] = useState(null);
  const [enter, setEnter] = useState(true);
  const mode = isLight(theme?.mode) ? "light" : "dark";
  const timer = useRef(null);
  const last = useRef("");
  const load = useCallback(async () => {
    try {
      const b = await api.get(`${API}/board`);
      const key = JSON.stringify(b);
      if (key !== last.current) {
        last.current = key;
        setBoard(b);
      }
      setErr("");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, [api]);
  useEffect(() => {
    api.get(`${API}/settings`).then((s) => setRepo(s.repo)).catch(() => {
    });
    load();
    const tick = () => {
      if (document.visibilityState === "visible") load();
    };
    timer.current = window.setInterval(tick, 3e3);
    const t = window.setTimeout(() => setEnter(false), 1400);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      window.clearTimeout(t);
    };
  }, [load, api]);
  const issues = board?.issues || [];
  const by = (lane) => issues.filter((c) => laneOf(c) === lane);
  const decisions = board?.decisions || {};
  const counts = useMemo(() => ({
    open: issues.length,
    bugs: issues.filter((c) => c.kind === "bug").length,
    features: issues.filter((c) => c.kind === "feature").length,
    questions: issues.filter((c) => c.kind === "question" || c.kind === "docs").length,
    needs: by("needs_you").length + by("ready").length,
    ready: by("ready").length
  }), [board]);
  const saveRepo = async () => {
    try {
      const s = await api.post(`${API}/settings`, { repo });
      setRepo(s.repo);
      notify(s.repo_exists ? `Repo folder saved: ${s.repo}` : `Saved, but ${s.repo} does not exist yet.`, { type: s.repo_exists ? "success" : "info" });
      load();
    } catch (e) {
      notify(String(e?.message || e), { type: "error" });
    }
  };
  const runNow = () => openChat({
    agent: AGENT,
    autoSend: true,
    message: `Run the Backlog Factory on my repo folder: ${repo || "~/ato-2026-dup-triage"}. Use every Backlog Factory skill you have, in order, and skip a step that has no new work (the board is the memory). Ask me yes/no once per step. Write nothing to GitHub.`
  });
  const sendBack = (c) => openChat({
    agent: AGENT,
    autoSend: true,
    message: `Send #${c.n} back to the fixer for one more round. Repo folder: ${repo}. My note: (type it here). Follow the fix-review skill; ask me yes/no first.`
  });
  const decide = async (n, choice) => {
    try {
      await api.post(`${API}/decide`, { n, choice });
      notify(`#${n}: ${choice.replace(/_/g, " ")} saved. The next run uses it.`, { type: "success" });
      load();
    } catch (e) {
      notify(String(e?.message || e), { type: "error" });
    }
  };
  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${what} copied.`, { type: "success" });
    } catch {
      notify(text, { type: "info" });
    }
  };
  const openDiff = async (n) => {
    try {
      const r = await api.raw(`${API}/diff?n=${n}`);
      setDiff({ n, text: await r.text() });
    } catch (e) {
      notify(`No saved diff for #${n} yet.`, { type: "info" });
    }
  };
  const chosen = (n, choice) => decisions[String(n)]?.choice === choice;
  const head = (crumb, title) => /* @__PURE__ */ jsxs("div", { className: "top", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "crumb", children: crumb }),
      /* @__PURE__ */ jsx("h1", { children: title })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "right", children: [
      /* @__PURE__ */ jsxs("div", { className: "brand", children: [
        /* @__PURE__ */ jsx("img", { className: "kc", src: asset("kirocrew-icon.png"), alt: "Kiro Crew" }),
        /* @__PURE__ */ jsx("img", { className: "ato", src: asset("ato-short-white.png"), alt: "All Things Open 2026" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "pill", children: "Timer 7:00 AM ET \xB7 Mon-Fri \xB7 paused" }),
      /* @__PURE__ */ jsx("button", { className: "go", onClick: runNow, children: "Run now" })
    ] })
  ] });
  const statRow = /* @__PURE__ */ jsx("div", { className: "stats", role: "list", "aria-label": "Counts", children: [
    ["open issues", counts.open, ""],
    ["bugs", counts.bugs, "red"],
    ["features", counts.features, "kc"],
    ["questions + docs", counts.questions, ""],
    ["need you", counts.needs, "gold"],
    ["ready to merge", counts.ready, "green"]
  ].map(([l, v, cl], i) => /* @__PURE__ */ jsxs("div", { role: "listitem", className: `stat ${cl}`, style: { ["--i"]: i }, children: [
    /* @__PURE__ */ jsx("b", { children: v }),
    /* @__PURE__ */ jsx("span", { children: l })
  ] }, l)) });
  const BoardView = () => /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "lanes", children: LANES.map((L) => {
      const cards = by(L.id);
      return /* @__PURE__ */ jsxs("section", { className: `lane ${L.tone || ""}`, "aria-label": `${L.label}, ${cards.length} issues`, children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          /* @__PURE__ */ jsx("span", { children: L.label }),
          /* @__PURE__ */ jsx("span", { children: cards.length })
        ] }),
        cards.map((c, i) => /* @__PURE__ */ jsxs("article", { className: `card rv ${laneOf(c) === "fix" ? "hot" : ""}`, style: { ["--i"]: i }, children: [
          /* @__PURE__ */ jsx("div", { className: "num", children: /* @__PURE__ */ jsxs("a", { href: issueUrl(board?.repo, c.n), target: "_blank", rel: "noreferrer", children: [
            "#",
            c.n
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "t", children: c.title }),
          /* @__PURE__ */ jsx(Chips, { c }),
          c.reason && /* @__PURE__ */ jsx("div", { className: "why", children: c.reason }),
          c.kind === "bug" && laneOf(c) !== "inbox" && /* @__PURE__ */ jsx("button", { style: { marginTop: 6, fontSize: 13, padding: "4px 10px" }, onClick: () => {
            setPick(c.n);
            setTab("Bugs");
          }, children: "Details" })
        ] }, c.n))
      ] }, L.id);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "foot", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Rejected ",
        by("rejected").length,
        " \xB7 Duplicate ",
        by("duplicate").length,
        " \xB7 ",
        by("rejected").concat(by("duplicate")).map((c) => `#${c.n}`).join(" ") || "none yet"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        board?.run?.state === "running" ? `Running: ${board?.run?.step}` : `Last run ${board?.updated || "\u2014"}`,
        " \xB7 ",
        issues.length,
        " read (",
        board?.source || "live",
        ")"
      ] })
    ] })
  ] });
  const bugs = issues.filter((c) => c.kind === "bug" && !["duplicate", "inbox"].includes(laneOf(c)));
  const BugView = () => {
    const c = bugs.find((b) => b.n === pick) || bugs.find((b) => laneOf(b) === "ready") || bugs.find((b) => laneOf(b) === "fix") || bugs[0];
    if (!c) return /* @__PURE__ */ jsx("p", { className: "why", children: "No bugs sorted yet. Run the factory first." });
    if (typeof c.repro === "string") c.repro = { note: c.repro, result: "noted" };
    const steps = [["Sorted: bug", true], ["Reproduced", !!c.repro?.result], ["Details added", !!c.details], [`Fix \u21C4 Review${c.fix?.rounds?.length ? ` \xB7 round ${c.fix.rounds.length}` : ""}`, laneOf(c) === "ready"], ["Ready to merge", laneOf(c) === "ready"], ["You merge", false]];
    const nowIdx = steps.findIndex(([, d]) => !d);
    return /* @__PURE__ */ jsxs("div", { className: "two", children: [
      /* @__PURE__ */ jsx("nav", { className: "list", "aria-label": "Bugs", children: bugs.map((b) => /* @__PURE__ */ jsxs("button", { "aria-current": b.n === c.n, onClick: () => setPick(b.n), children: [
        "#",
        b.n,
        " ",
        b.title,
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "why", children: b.status || b.lane })
      ] }, b.n)) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "track", "aria-label": "Progress", children: steps.map(([l, d], i) => /* @__PURE__ */ jsxs("span", { className: d ? "done" : i === nowIdx ? "now" : "", children: [
          d ? "\u2713 " : "",
          l
        ] }, l)) }),
        /* @__PURE__ */ jsxs("div", { className: "two", style: { gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)" }, children: [
          /* @__PURE__ */ jsxs("div", { className: "panel", children: [
            /* @__PURE__ */ jsx("div", { className: "h", children: "What the agents found" }),
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("b", { children: "Sorted as a bug" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "why", children: "triage" }),
              /* @__PURE__ */ jsx("br", {}),
              c.reason,
              c.dup_of ? ` Same as #${c.dup_of}.` : ""
            ] }),
            c.frame?.whys?.length ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "h", children: "Five whys" }),
              c.frame.whys.map((w, i) => /* @__PURE__ */ jsxs("div", { className: "why", children: [
                "why? ",
                w
              ] }, i))
            ] }) : null,
            c.repro ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "h", children: [
                "Reproduced \xB7 ",
                c.repro.where || "your clone"
              ] }),
              /* @__PURE__ */ jsxs("pre", { children: [
                c.repro.cmd ? `$ ${c.repro.cmd}
${c.repro.out || ""}` : "",
                c.repro.note ? `
\u2190 ${c.repro.note}` : "",
                c.repro.test ? `
new test: ${c.repro.test}  ${c.repro.result || ""}` : ""
              ] })
            ] }) : /* @__PURE__ */ jsx("p", { className: "why", children: "Not reproduced yet." }),
            c.details && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "h", children: "Details added" }),
              /* @__PURE__ */ jsx("p", { className: "root", children: c.details })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "panel", children: [
            /* @__PURE__ */ jsx("div", { className: "h", children: "Fix \u21C4 Review" }),
            /* @__PURE__ */ jsxs("div", { className: "row", style: { justifyContent: "space-between" }, children: [
              /* @__PURE__ */ jsx("div", { className: "chip", children: "Fixer \xB7 writes the fix" }),
              /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u21C4" }),
              /* @__PURE__ */ jsx("div", { className: "chip", children: "Reviewer \xB7 reads diff, runs tests" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounds", children: [
              (c.fix?.rounds || []).map((r0, i) => {
                const r = r0;
                const num = r.n ?? r.round ?? i + 1;
                const green = /green/i.test(String(r.verdict ?? r.review ?? ""));
                return /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("span", { className: "num", children: [
                    "round ",
                    num
                  ] }),
                  r.stat && /* @__PURE__ */ jsx("span", { className: "chip", children: r.stat }),
                  /* @__PURE__ */ jsx("span", { className: green ? "ok" : "no", children: green ? "Green:" : "Changes asked:" }),
                  /* @__PURE__ */ jsx("span", { className: "why", children: r.note ?? r.fixer ?? r.tests ?? "" })
                ] }, i);
              }),
              c.fix?.branch && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "num", children: "branch" }),
                /* @__PURE__ */ jsx("span", { className: "chip", children: c.fix.branch }),
                /* @__PURE__ */ jsx("span", { className: "why", children: "local \xB7 not pushed" })
              ] }),
              !c.fix?.rounds?.length && /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("span", { className: "why", children: "No rounds yet." }) })
            ] }),
            laneOf(c) === "ready" && /* @__PURE__ */ jsxs("div", { className: "ready", children: [
              /* @__PURE__ */ jsx("b", { className: "ok", children: "Ready for you" }),
              /* @__PURE__ */ jsx("p", { className: "why", children: "Review is green. Read the diff, then merge it yourself." }),
              /* @__PURE__ */ jsxs("div", { className: "row", children: [
                /* @__PURE__ */ jsx("button", { className: "go", onClick: () => openDiff(c.n), children: "Open diff" }),
                /* @__PURE__ */ jsx("button", { onClick: () => copy(c.fix?.merge_cmd || `git merge factory/fix-${c.n}`, "Merge command"), children: "Copy merge command" }),
                /* @__PURE__ */ jsx("button", { onClick: () => sendBack(c), children: "Send back" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] });
  };
  const feats = issues.filter((c) => (c.kind === "feature" || c.kind === "docs") && c.frame && ["triage", "needs_you", "rejected", "inbox"].includes(laneOf(c)));
  const VERDICT = {
    build: ["Build it", "Goes to the fixer."],
    reframe: ["Reframe it", "Solve the root, not the ask."],
    needs_you: ["Needs you", "Product-level. Your call."],
    reject: ["Reject", "Not a good problem for jot."]
  };
  const FeatureView = () => /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "track", children: [
      /* @__PURE__ */ jsx("span", { className: "now", children: "1 \xB7 Good problem?" }),
      /* @__PURE__ */ jsx("span", { className: "now", children: "2 \xB7 Five whys \u2192 root" }),
      /* @__PURE__ */ jsx("span", { className: "now", children: "3 \xB7 First principles \u2192 best fix" }),
      /* @__PURE__ */ jsx("span", { children: "Build \xB7 Reframe \xB7 Needs you \xB7 Reject" })
    ] }),
    !feats.length && /* @__PURE__ */ jsx("p", { className: "why", children: "No features sorted yet. Run the factory first." }),
    /* @__PURE__ */ jsx("div", { className: "feats", children: feats.map((c, i) => {
      const v = c.verdict && VERDICT[c.verdict] ? c.verdict : laneOf(c) === "needs_you" ? "needs_you" : laneOf(c) === "rejected" ? "reject" : "build";
      return /* @__PURE__ */ jsxs("article", { className: "feat rv", style: { ["--i"]: i }, children: [
        /* @__PURE__ */ jsxs("div", { className: "num", children: [
          "#",
          c.n,
          " \xB7 ",
          c.kind
        ] }),
        /* @__PURE__ */ jsx("h3", { style: { margin: "2px 0 6px" }, children: c.title }),
        /* @__PURE__ */ jsxs("div", { className: "chips", children: [
          c.size && /* @__PURE__ */ jsx("span", { className: `chip ${c.size === "small" ? "g" : "y"}`, children: c.size === "product" ? "product-level" : c.size }),
          c.asked && c.asked.length > 1 && /* @__PURE__ */ jsxs("span", { className: "chip", children: [
            "asked ",
            c.asked.length,
            "\xD7: ",
            c.asked.map((x) => `#${x}`).join(" ")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "step", children: [
          /* @__PURE__ */ jsx("b", { children: "1 \xB7 Good problem?" }),
          /* @__PURE__ */ jsx("div", { children: c.frame?.good })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "step", children: [
          /* @__PURE__ */ jsx("b", { children: "2 \xB7 Five whys" }),
          (c.frame?.whys || []).map((w, j) => /* @__PURE__ */ jsxs("div", { className: "why", children: [
            "why? ",
            w
          ] }, j)),
          c.frame?.root && /* @__PURE__ */ jsxs("div", { className: "root", children: [
            "Root: ",
            c.frame.root
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "step", children: [
          /* @__PURE__ */ jsx("b", { children: "3 \xB7 First principles" }),
          /* @__PURE__ */ jsx("div", { children: c.frame?.best })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `verdict ${v}`, children: [
          /* @__PURE__ */ jsx("h4", { children: VERDICT[v][0] }),
          /* @__PURE__ */ jsx("div", { className: "why", children: c.lean || VERDICT[v][1] }),
          /* @__PURE__ */ jsxs("div", { className: "row", style: { marginTop: 8 }, children: [
            v === "build" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { className: "go", "aria-pressed": chosen(c.n, "build"), onClick: () => decide(c.n, "build"), children: "OK" }),
              /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "reject"), onClick: () => decide(c.n, "reject"), children: "No" })
            ] }),
            v === "reframe" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { className: "go", "aria-pressed": chosen(c.n, "reframe"), onClick: () => decide(c.n, "reframe"), children: "OK" }),
              /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "as_asked"), onClick: () => decide(c.n, "as_asked"), children: "Build as asked" })
            ] }),
            v === "needs_you" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { className: "go", "aria-pressed": chosen(c.n, "agree"), onClick: () => decide(c.n, "agree"), children: "Agree with lean" }),
              /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "build"), onClick: () => decide(c.n, "build"), children: "Build all" }),
              /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "reject"), onClick: () => decide(c.n, "reject"), children: "Reject" })
            ] }),
            v === "reject" && /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "build"), onClick: () => decide(c.n, "build"), children: "Build anyway" })
          ] })
        ] })
      ] }, c.n);
    }) })
  ] });
  const NEEDS = {
    merge: ["MERGE", "var(--green-t)"],
    product: ["PRODUCT CALL", "var(--gold-t)"],
    cant_reproduce: ["CAN'T REPRODUCE", "var(--red-t)"],
    needs_info: ["NEEDS INFO", "var(--red-t)"],
    stuck: ["STUCK", "var(--red-t)"]
  };
  const needRows = [...by("ready").map((c) => ({ ...c, needs: "merge" })), ...by("needs_you")];
  const NeedsView = () => /* @__PURE__ */ jsxs("div", { className: "needs", children: [
    !needRows.length && /* @__PURE__ */ jsx("p", { className: "why", children: "Nothing needs you yet." }),
    needRows.map((c) => {
      const [k, col] = NEEDS[c.needs || "product"] || NEEDS.product;
      return /* @__PURE__ */ jsxs("div", { className: "rv", children: [
        /* @__PURE__ */ jsx("span", { className: "k", style: { color: col }, children: k }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("b", { children: [
            "#",
            c.n,
            " ",
            c.title
          ] }),
          /* @__PURE__ */ jsx("div", { className: "why", children: c.needs === "merge" ? `Review green \xB7 tests ${c.fix?.tests || "?"} \xB7 branch ${c.fix?.branch || ""}` : c.lean || c.reason })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "row", children: [
          c.needs === "merge" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { className: "go", onClick: () => openDiff(c.n), children: "Open diff" }),
            /* @__PURE__ */ jsx("button", { onClick: () => copy(c.fix?.merge_cmd || `git merge factory/fix-${c.n}`, "Merge command"), children: "Copy merge command" })
          ] }),
          c.needs === "product" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { className: "go", "aria-pressed": chosen(c.n, "agree"), onClick: () => decide(c.n, "agree"), children: "Agree" }),
            /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "build"), onClick: () => decide(c.n, "build"), children: "Build" }),
            /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "reject"), onClick: () => decide(c.n, "reject"), children: "Reject" })
          ] }),
          (c.needs === "cant_reproduce" || c.needs === "needs_info") && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", { className: "go", onClick: () => copy(c.reply || c.reason || "", "Reply"), children: "Copy reply" }),
            /* @__PURE__ */ jsx("button", { "aria-pressed": chosen(c.n, "park"), onClick: () => decide(c.n, "park"), children: "Park it" })
          ] }),
          c.needs === "stuck" && /* @__PURE__ */ jsx("button", { onClick: () => sendBack(c), children: "Send back" })
        ] })
      ] }, c.n);
    }),
    /* @__PURE__ */ jsxs("div", { className: "foot", children: [
      /* @__PURE__ */ jsx("span", { children: "Everything else runs on its own. You only see these." }),
      /* @__PURE__ */ jsx("span", { children: "All fixes on local branches" })
    ] })
  ] });
  const titles = {
    Board: [`${board?.repo || "ato-2026-dup-triage"} \xB7 read only`, "Backlog Factory"],
    Bugs: ["Backlog Factory > Bugs", "Prove it, fix it, review it"],
    Features: ["Backlog Factory > Features", "Is it a good problem? Then the best fix."],
    "Needs you": ["Backlog Factory > Needs you", `${needRows.length} things only you can decide`]
  };
  return /* @__PURE__ */ jsxs("div", { className: `bf ${enter && !reduced() ? "enter" : ""}`, "data-mode": mode, children: [
    /* @__PURE__ */ jsx("style", { children: CSS }),
    /* @__PURE__ */ jsxs("div", { className: "wrap", children: [
      /* @__PURE__ */ jsx("div", { className: "rule", "aria-hidden": "true" }),
      head(titles[tab][0], titles[tab][1]),
      /* @__PURE__ */ jsxs("div", { className: "row", style: { margin: "0 0 12px" }, children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "bf-repo", children: /* @__PURE__ */ jsx("b", { children: "Repo folder" }) }),
        /* @__PURE__ */ jsx("input", { id: "bf-repo", className: "repo", value: repo, onChange: (e) => setRepo(e.target.value), placeholder: "~/ato-2026-dup-triage" }),
        /* @__PURE__ */ jsx("button", { onClick: saveRepo, children: "Save" }),
        err && /* @__PURE__ */ jsxs("span", { className: "no", role: "alert", children: [
          "Board not readable: ",
          err
        ] })
      ] }),
      board?.empty ? /* @__PURE__ */ jsxs("div", { className: "empty", children: [
        /* @__PURE__ */ jsx("h2", { children: "No board yet" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "The factory writes ",
          /* @__PURE__ */ jsx("code", { children: "factory/board.json" }),
          " in your repo folder (",
          board.repo,
          board.repo_exists ? "" : ", not found: fix the folder above",
          ")."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Press ",
          /* @__PURE__ */ jsx("b", { children: "Run now" }),
          ". A chat opens with the backlog-factory agent. It asks yes/no before it writes, and it never writes to GitHub."
        ] })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        statRow,
        /* @__PURE__ */ jsx("div", { className: "tabs", role: "tablist", children: TABS.map((t) => /* @__PURE__ */ jsxs("button", { role: "tab", "aria-selected": tab === t, onClick: () => setTab(t), children: [
          t,
          t === "Needs you" && needRows.length ? ` (${needRows.length})` : ""
        ] }, t)) }),
        /* @__PURE__ */ jsxs("div", { role: "tabpanel", children: [
          tab === "Board" && BoardView(),
          tab === "Bugs" && BugView(),
          tab === "Features" && FeatureView(),
          tab === "Needs you" && NeedsView()
        ] })
      ] })
    ] }),
    diff && /* @__PURE__ */ jsx("div", { className: "modal", role: "dialog", "aria-modal": "true", "aria-label": `Diff for #${diff.n}`, onClick: () => setDiff(null), children: /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "row", style: { justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxs("b", { children: [
          "factory/fix-",
          diff.n,
          " \xB7 local, not pushed"
        ] }),
        /* @__PURE__ */ jsx("button", { autoFocus: true, onClick: () => setDiff(null), children: "Close" })
      ] }),
      /* @__PURE__ */ jsx("pre", { children: diff.text })
    ] }) })
  ] });
}
export {
  BacklogFactory as default
};
