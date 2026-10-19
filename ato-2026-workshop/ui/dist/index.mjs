// src/App.tsx
import { useChatLauncher, useNotify, useTheme } from "@kirocrew/app-sdk";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

// src/motion.ts
var EASE = {
  snappy: "cubic-bezier(.16,1,.3,1)",
  // strong ease-out: entrances, landings
  out: "cubic-bezier(.22,1,.36,1)",
  // softer ease-out: followers, sparks
  over: "cubic-bezier(.34,1.45,.64,1)"
  // ~8% overshoot, then settle: pops, seats
};
var reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function hop(el) {
  if (!el || reducedMotion() || !("animate" in el)) return;
  el.animate(
    [
      { transform: "translateY(0) rotate(0) scale(1,1)", easing: "cubic-bezier(.2,.7,.3,1)" },
      { transform: "translateY(-20px) rotate(-7deg) scale(.95,1.05)", offset: 0.42, easing: "cubic-bezier(.6,0,.9,.5)" },
      { transform: "translateY(0) rotate(0) scale(1.16,.84)", offset: 0.74, easing: EASE.out },
      { transform: "translateY(0) rotate(0) scale(1,1)" }
    ],
    { duration: 600 }
  );
}
function pulse(el, to = 1.1, duration = 420) {
  if (!el || reducedMotion() || !("animate" in el)) return;
  el.animate(
    [{ transform: "scale(1)" }, { transform: `scale(${to})`, offset: 0.45 }, { transform: "scale(1)" }],
    { duration, easing: EASE.out }
  );
}
function spark(host) {
  if (!host || reducedMotion() || !("animate" in host)) return;
  const n = 12;
  const colors = ["#EA3A40", "#8E48FF", "#ffffff", "#ff7a7f"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    s.setAttribute("aria-hidden", "true");
    s.style.background = colors[i % colors.length];
    s.style.color = colors[i % colors.length];
    host.appendChild(s);
    const a = i / n * Math.PI * 2 + (i % 2 ? 0.18 : -0.12);
    const d = 50 + i % 3 * 10;
    const dx = Math.cos(a) * d;
    const dy = Math.sin(a) * d;
    const anim = s.animate(
      [
        { transform: "translate(-50%,-50%) translate(0px,0px) scale(.4)", opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${dx * 0.7}px,${dy * 0.7}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.2)`, opacity: 0 }
      ],
      { duration: 520, delay: i * 10, easing: EASE.out, fill: "backwards" }
    );
    anim.onfinish = () => s.remove();
    anim.oncancel = () => s.remove();
  }
}

// src/App.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var APP = "ato-2026-workshop";
var GUIDE_AGENT = "workshop-guide";
var BASE_REPO = "KiroCrewCaptain/ato-2026-dup-triage";
var asset = (f) => new URL(`./assets/${f}`, import.meta.url).href;
function isLight(sdkMode) {
  const resolved = typeof document !== "undefined" ? document.documentElement.dataset.mode : "";
  if (resolved === "light" || resolved === "dark") return resolved === "light";
  return /light/.test(sdkMode || "");
}
var STEPS = [
  {
    id: "s1",
    n: 1,
    title: "Check your setup",
    ghost: "pose-1.svg",
    does: "The guide looks at your repo folder, Python, git and the kirocrew command. It only reads.",
    see: "A short checklist that ends with \u201CAll set, press Step 2\u201D."
  },
  {
    id: "s2",
    n: 2,
    lab: "Lab 1",
    title: "Build your app",
    ghost: "pose-3.svg",
    does: "The guide copies Lab 1 into backlog-factory/ and installs your app, after your yes.",
    see: "Backlog Factory in the sidebar, after you trust and enable it in Library."
  },
  {
    id: "s3",
    n: 3,
    lab: "Lab 1",
    title: "Sort the backlog",
    ghost: "pose-5.svg",
    does: "Press Run now on your app\u2019s page. Its agent sorts each issue using three checks: right problem, five whys, first principles.",
    see: "A board with lanes and counts. Each card has a verdict and a one-line reason."
  },
  {
    id: "s4",
    n: 4,
    lab: "Lab 2",
    title: "Reproduce with helpers",
    ghost: "pose-7.svg",
    does: "Your app splits the bugs across helper agents. Each runs jot in your folder and pastes the real output.",
    see: "Bugs with a real command and output. Each helper waits for your Allow."
  },
  {
    id: "s5",
    n: 5,
    lab: "Lab 3",
    title: "Fix \u21C4 Review",
    ghost: "pose-8.svg",
    does: "A fixer and a separate reviewer loop on a local branch until the review is green. Needs git.",
    see: "A card in Ready to merge. You read the diff and you merge."
  },
  {
    id: "s6",
    n: 6,
    title: "Remix it into your idea",
    ghost: "wave.svg",
    does: "Tell the guide your rule or lane. It edits your app\u2019s skill and reinstalls.",
    see: "Your own rule on the board after the next Run now."
  },
  {
    id: "s7",
    n: 7,
    title: "Share it",
    ghost: "pose-1.svg",
    does: "The guide zips your app folder. Nothing goes to GitHub today.",
    see: "backlog-factory.zip. A friend installs it with Install from Path."
  }
];
var SETUP = [
  { id: "c1", title: "Kiro Crew installed", hint: "You are reading this page, so yes." },
  { id: "c2", title: "Signed in", hint: "The Set up Kiro page is done and a chat answers." },
  { id: "c3", title: "Repo cloned (or ZIP downloaded)", hint: "git clone the starter repo into ~/ato-2026-dup-triage. No git? Download the ZIP and unzip it: ato-2026-dup-triage-main." },
  { id: "c4", title: "Python 3.9 or newer", hint: "The factory runs jot to reproduce bugs. Check: python3 --version (Windows: py --version)." }
];
var PLUGIN = [
  { k: "Skill", code: "skills/", real: "skills/factory-triage" },
  { k: "MCP", code: "mcpServers", real: "optional: none of its own" }
];
var APP_PARTS = [
  { k: "Cron jobs", code: "crons", real: "factory-weekday, paused" },
  { k: "Memory", code: "board file", real: "factory/board.json" },
  { k: "Harness API", code: "@kirocrew-core", real: "spawn_run \xB7 spawn_continue" },
  { k: "UI bundle", code: "ui/dist + backend", real: "the board page" }
];
var OS_MAP = [
  ["OS", "Kiro Crew"],
  ["App", "Your Kiro Crew app"],
  ["App store", "Discover \xB7 Library"]
];
var store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(`${APP}:${k}`);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`${APP}:${k}`, JSON.stringify(v));
    } catch {
    }
  }
};
function promptFor(step, clone) {
  const lab = step.lab ? ` (${step.lab})` : "";
  return `STEP ${step.n} \u2014 ${step.title}${lab}. My clone folder: ${clone}. Follow the workshop-guide skill for this step. Ask me yes/no before you change anything.`;
}
var ZIP_URL = `https://github.com/${BASE_REPO}/archive/refs/heads/main.zip`;
var CSS = `
@font-face{font-family:"ATO Space Grotesk";font-weight:400 700;font-display:swap;src:url("${asset("fonts/SpaceGrotesk-latin.woff2")}") format("woff2")}
@font-face{font-family:"ATO JetBrains Mono";font-weight:400 500;font-display:swap;src:url("${asset("fonts/JetBrainsMono-latin.woff2")}") format("woff2")}
.atows{--red:#EA3A40;--red-dk:#B8283D;--kc:#8E48FF;--kc-2:#844CF5;--night:#140b23;--black:#140b15;
  --ease:cubic-bezier(.16,1,.3,1);--e-snappy:cubic-bezier(.16,1,.3,1);--e-out:cubic-bezier(.22,1,.36,1);--e-over:cubic-bezier(.34,1.45,.64,1);
  --sans:"ATO Space Grotesk","Space Grotesk",system-ui,sans-serif;--mono:"ATO JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;
  height:100%;overflow-y:auto;font-family:var(--sans);font-size:18px;line-height:1.5;-webkit-font-smoothing:antialiased}
.atows[data-mode=dark]{--bg:#0f0819;--ink:#f6f0fa;--muted:#c3b8d2;--card:rgba(255,255,255,.045);--line:rgba(255,255,255,.12);--accent-text:#ff7a7f;--kc-text:#c4a6ff;--field:#1b1029;--box:#c3b8d2}
.atows[data-mode=light]{--bg:#f7f4fb;--ink:#1b1225;--muted:#4f4560;--card:#ffffff;--line:rgba(27,18,37,.14);--accent-text:#B8283D;--kc-text:#6a2fd6;--field:#ffffff;--box:#6b5f7d}
.atows{background:var(--bg);color:var(--ink)}
.atows *{box-sizing:border-box}
.atows a{color:var(--kc-text);text-underline-offset:3px}
.atows :focus-visible{outline:3px solid var(--kc-text);outline-offset:3px;border-radius:10px}
.atows .wrap{max-width:1180px;margin:0 auto;padding:0 40px}
/* hero: always dark, the ATO stage look */
.atows .hero{position:relative;overflow:hidden;color:#f6f0fa;background:linear-gradient(160deg,var(--night) 0%,var(--black) 78%)}
.atows .hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:
  radial-gradient(ellipse at 18% 85%,rgba(184,40,61,.28) 0%,transparent 52%),
  radial-gradient(ellipse at 82% 15%,rgba(234,58,64,.16) 0%,transparent 50%),
  radial-gradient(ellipse at 62% 70%,rgba(142,72,255,.22) 0%,transparent 55%)}
.atows .sweep{position:absolute;left:-25%;top:-60%;width:70%;height:190%;pointer-events:none;opacity:0;
  background:radial-gradient(closest-side,rgba(255,236,240,.16),rgba(142,72,255,.12) 45%,transparent 72%)}
.atows .rule{position:absolute;left:0;top:0;height:6px;width:100%;background:linear-gradient(90deg,var(--red) 0%,var(--red) 30%,var(--kc) 100%);transform-origin:left}
.atows .hero .wrap{position:relative;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:48px;align-items:center;padding-top:64px;padding-bottom:56px}
.atows .brandrow{display:flex;align-items:center;gap:14px;margin-bottom:22px}
.atows .brandrow img{width:52px;height:52px;border-radius:13px}
.atows .wordmark{font-weight:700;letter-spacing:.08em;font-size:17px}
.atows .x{color:#ff7a7f;font-weight:700}
.atows .eyebrow{font-family:var(--mono);font-size:15px;letter-spacing:.06em;color:#c3b8d2;text-transform:uppercase}
.atows h1{font-size:clamp(40px,4.6vw,64px);line-height:1.04;letter-spacing:-.02em;margin:0 0 14px;font-weight:700}
.atows h1 .w{display:inline-block}
.atows .tag{font-size:clamp(22px,2.2vw,30px);line-height:1.2;color:#ff6a70;font-weight:600;margin:0 0 26px}
.atows .facts{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 22px;padding:0;list-style:none}
.atows .facts li{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);border-radius:999px;padding:8px 16px;font-size:17px;font-weight:600}
.atows .people{color:#d8cfe4;font-size:17px;margin:0}
.atows .people b{color:#fff}
.atows .logo{justify-self:center;padding:48px;max-width:440px;width:100%}
.atows .logo img{display:block;width:100%;height:auto}
.atows .ghost-hero{position:absolute;right:4%;bottom:-18px;width:120px;height:auto;filter:drop-shadow(0 10px 30px rgba(142,72,255,.45))}
/* hero entrance: plays once on load, ~1.3 s, then rests */
.atows.enter .rule{animation:atows-draw .7s var(--e-snappy) both}
.atows.enter .sweep{animation:atows-sweep 1.15s var(--e-out) .1s both}
.atows.enter .brandrow img{animation:atows-pop-in .55s var(--e-over) .05s backwards}
.atows.enter .rise{animation:atows-rise .6s var(--e-snappy) backwards;animation-delay:var(--d,0s)}
.atows.enter h1 .w{animation:atows-word .6s var(--e-snappy) backwards;animation-delay:var(--d,0s)}
.atows.enter .facts li{animation:atows-rise .5s var(--e-snappy) backwards;animation-delay:var(--d,0s)}
.atows.enter .logo{animation:atows-blur-scale .7s var(--e-snappy) .25s backwards}
.atows.enter .ghost-hero{animation:atows-ghost-in .7s var(--e-over) .45s backwards}
/* progress track */
.atows .track{position:relative;margin:34px 0 0}
.atows .track .lbl{display:flex;justify-content:space-between;font-size:16px;color:var(--muted);margin-bottom:10px;font-weight:600}
.atows .bar{position:relative;height:14px;border-radius:999px;background:var(--line)}
.atows .fill{position:absolute;inset:0;border-radius:999px;background:linear-gradient(90deg,var(--red-dk),var(--red) 35%,var(--kc));transform-origin:left;transition:transform .65s var(--e-over)}
.atows .mtrack{position:absolute;inset:0;pointer-events:none;transition:transform .65s var(--e-over)}
.atows .marker{position:absolute;left:0;top:50%;width:44px;height:44px;margin:-28px 0 0 -22px}
.atows .marker .float{display:block;width:100%;height:100%}
.atows .marker .float.idle{animation:atows-idle 5s ease-in-out infinite}
.atows .marker img{display:block;width:100%;height:100%;transform-origin:50% 90%}
/* sections reveal on scroll */
.atows section.s{padding:52px 0 8px}
.atows h2{font-size:34px;letter-spacing:-.01em;margin:0 0 6px}
.atows .lead{color:var(--muted);margin:0 0 24px;font-size:19px}
.atows .rv:not(.in) .rvi{opacity:0;transform:translateY(26px)}
.atows .rv.in .rvi{animation:atows-reveal .6s var(--e-snappy) backwards;animation-delay:calc(var(--i,0) * 70ms)}
.atows .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.atows .card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px;transition:transform .35s var(--e-over),border-color .3s var(--e-snappy)}
.atows .card::before{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s var(--e-snappy);
  box-shadow:0 0 0 1px rgba(142,72,255,.4),0 18px 50px -18px rgba(234,58,64,.5),0 10px 40px -20px rgba(142,72,255,.75)}
.atows .card:hover,.atows .card:focus-within{transform:translateY(-3px);border-color:rgba(142,72,255,.7)}
.atows .card:hover::before,.atows .card:focus-within::before{opacity:1}
/* checkboxes: native input kept for keyboard and screen readers; the tick draws */
.atows .cbox{position:relative;flex:none;width:28px;height:28px;margin-top:2px}
.atows .cbox.sm{width:22px;height:22px;margin:0}
.atows .cbox input{-webkit-appearance:none;appearance:none;position:absolute;inset:0;margin:0;border-radius:8px;border:2px solid var(--box);background:var(--field);cursor:pointer;transition:background-color .2s var(--e-snappy),border-color .2s var(--e-snappy)}
.atows .cbox.sm input{border-radius:6px}
.atows .cbox input:checked{background:var(--kc);border-color:var(--kc)}
.atows .cbox input:focus-visible{outline:3px solid var(--kc-text);outline-offset:3px}
.atows .cbox svg{position:absolute;inset:3px;pointer-events:none;fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
.atows .cbox path{stroke-dasharray:22;stroke-dashoffset:22;transition:stroke-dashoffset .38s var(--e-snappy) .05s}
.atows .cbox input:checked + svg path{stroke-dashoffset:0}
.atows .check{display:flex;gap:14px;align-items:flex-start;cursor:pointer}
.atows .check b{display:block;font-size:20px}
.atows .check span{color:var(--muted);font-size:17px}
.atows .field{margin-top:18px;display:grid;gap:8px}
.atows .field label{font-weight:700;font-size:17px}
.atows .field input{font:500 18px var(--mono);padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--field);color:var(--ink);width:100%}
.atows .field small{color:var(--muted);font-size:15px}
.atows .links{display:flex;flex-wrap:wrap;gap:6px 18px}
/* "What is a Kiro Crew app?" build-up */
.atows .build{display:grid;gap:22px}
.atows .eq{display:flex;align-items:stretch;flex-wrap:wrap;gap:12px 0}
.atows .frag{display:flex;align-items:stretch}
.atows .op{align-self:center;font:700 34px/1 var(--sans);color:var(--accent-text);padding:0 12px}
.atows .tile{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;justify-content:center;gap:8px;min-width:150px}
.atows .tile b{font-size:24px;line-height:1.1}
.atows .tile code{font-family:var(--mono);font-size:15px;color:var(--muted)}
.atows .tile span{font-size:16px;color:var(--muted)}
.atows .eq.r1 .tile{min-width:190px}.atows .eq.r1 .tile b{font-size:30px}
.atows .tile.plug{border:2px solid rgba(142,72,255,.75);background:rgba(142,72,255,.13)}
.atows .tile.app{border:3px solid var(--red);background:rgba(234,58,64,.13);min-width:150px}.atows .tile.app b{font-size:36px}
.atows .tile.app::after{content:"";position:absolute;inset:-7px;border-radius:21px;pointer-events:none;opacity:0;box-shadow:0 0 0 3px rgba(234,58,64,.65),0 0 44px rgba(234,58,64,.55)}
.atows .br{position:absolute;width:14px;height:14px;border:3px solid var(--accent-text);pointer-events:none}
.atows .br.tl{left:-11px;top:-11px;border-right:0;border-bottom:0;border-top-left-radius:6px;--bx:-16px;--by:-16px}
.atows .br.tr{right:-11px;top:-11px;border-left:0;border-bottom:0;border-top-right-radius:6px;--bx:16px;--by:-16px}
.atows .br.bl{left:-11px;bottom:-11px;border-right:0;border-top:0;border-bottom-left-radius:6px;--bx:-16px;--by:16px}
.atows .br.br2{right:-11px;bottom:-11px;border-left:0;border-top:0;border-bottom-right-radius:6px;--bx:16px;--by:16px}
.atows .eq.r2{flex-wrap:nowrap}
.atows .eq.r2 .op{font-size:28px;padding:0 7px}
.atows .eq.r2 .tile{min-width:0;padding:12px 14px;gap:6px}
.atows .eq.r2 .tile b{font-size:20px;white-space:nowrap}
.atows .eq.r2 .tile code{font-size:13px;white-space:nowrap}
.atows .eq.r2 .tile.app b{font-size:30px}
.atows .osrow h3{margin:8px 0 12px;font-size:26px}
.atows .osmap{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0}
.atows .pair{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.atows .pair dt{font-weight:700;color:var(--muted);min-width:84px}
.atows .pair dd{margin:0;font-weight:700;font-size:20px}
.atows .link{position:relative;flex:none;width:34px;height:12px;margin-right:6px}
.atows .link i{position:absolute;left:2px;right:2px;top:5px;height:2px;border-radius:2px;background:var(--accent-text);transform-origin:left}
.atows .link::before,.atows .link::after{content:"";position:absolute;top:2px;width:6px;height:6px;border:2px solid var(--accent-text);border-right:0;border-bottom:0}
.atows .link::before{left:1px;transform:rotate(-45deg)}
.atows .link::after{right:1px;transform:rotate(135deg)}
.atows .build:not(.on) .frag,.atows .build:not(.on) .pair{opacity:0}
.atows .build.on .frag{animation:atows-fly .62s var(--e-over) backwards;animation-delay:var(--dl,0ms)}
.atows .build.on .pair{animation:atows-reveal .5s var(--e-snappy) backwards;animation-delay:var(--dl,0ms)}
.atows .build.on .link i{animation:atows-draw .38s var(--e-snappy) backwards;animation-delay:calc(var(--dl,0ms) + 220ms)}
.atows .build.on .link::before,.atows .build.on .link::after{animation:atows-fade .25s ease-out backwards;animation-delay:calc(var(--dl,0ms) + 480ms)}
.atows .build.on .tile.plug.lit{animation:atows-pulse .42s var(--e-out) backwards;animation-delay:var(--pl,0ms)}
.atows .build.on .tile.app{animation:atows-pulse .45s var(--e-out) 1.86s backwards}
.atows .build.on .tile.app::after{animation:atows-flash .75s ease-out 1.86s backwards}
.atows .build.on .br{animation:atows-bracket .5s var(--e-over) 1.7s backwards}
.atows .real{margin-top:18px;color:var(--muted)}
.atows .real summary{cursor:pointer;font-weight:600;color:var(--ink)}
.atows .real ul{margin:10px 0 0;padding-left:22px;columns:2}
.atows .real li{margin:4px 0}.atows .real code{font-family:var(--mono);font-size:15px}
/* steps */
.atows .steps{display:grid;gap:18px;padding:0;margin:0;list-style:none}
.atows .step{display:grid;grid-template-columns:84px minmax(0,1fr) auto;gap:22px;align-items:center}
.atows .step .num{position:relative;width:84px;height:84px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(150deg,var(--red-dk),var(--kc));color:#fff;font-size:34px;font-weight:700}
.atows .step .num img{position:absolute;right:-14px;bottom:-12px;width:44px;height:44px}
.atows .step h3{margin:0 0 4px;font-size:24px}
.atows .step .lab{font-family:var(--mono);font-size:14px;color:var(--accent-text);letter-spacing:.06em;text-transform:uppercase;margin-left:10px}
.atows .step p{margin:0 0 4px}
.atows .step .see{color:var(--muted);font-size:17px}
.atows .step .see b{color:var(--ink)}
.atows .step .acts{display:grid;gap:10px;justify-items:stretch;min-width:220px}
.atows .step.done .num{background:linear-gradient(150deg,#1f7a52,#2aa36d)}
.atows .spark{position:absolute;left:50%;top:50%;width:10px;height:10px;border-radius:50%;pointer-events:none;z-index:2;opacity:0;box-shadow:0 0 10px currentColor}
.atows .btn{position:relative;overflow:hidden;font:700 18px var(--sans);border:0;border-radius:14px;padding:14px 20px;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--red-dk),var(--kc));box-shadow:0 8px 24px -10px rgba(142,72,255,.8);transition:transform .2s var(--e-over)}
.atows .btn::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.38) 50%,transparent 70%);transform:translateX(-120%)}
.atows .btn:hover{transform:translateY(-2px)}
.atows .btn:hover::after,.atows .btn:focus-visible::after{transform:translateX(120%);transition:transform .7s var(--e-snappy)}
.atows .btn:active{transform:translateY(0) scale(.96);transition-duration:.08s}
.atows .btn.ghostbtn{background:transparent;color:var(--ink);border:1px solid var(--line);box-shadow:none;font-size:16px;padding:10px 16px}
.atows .btn.ghostbtn::after{background:linear-gradient(110deg,transparent 30%,rgba(142,72,255,.18) 50%,transparent 70%)}
.atows .donebox{display:flex;align-items:center;gap:8px;justify-content:center;font-size:16px;color:var(--muted);cursor:pointer}
.atows .boundary{display:grid;grid-template-columns:auto minmax(0,1fr);gap:22px;align-items:center}
.atows .boundary img{width:86px;height:auto}
.atows .boundary ul{margin:0;padding-left:22px}
.atows .boundary li{margin:4px 0}
.atows .howto{margin:8px 0 10px;padding-left:24px}.atows .howto li{margin:6px 0}.atows .howto code,.atows .see code{font-family:var(--mono);font-size:15px}
.atows footer{padding:40px 0 56px;color:var(--muted);font-size:16px}
.atows .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@keyframes atows-draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes atows-sweep{0%{opacity:0;transform:translate(0,0)}25%{opacity:1}100%{opacity:0;transform:translate(150%,22%)}}
@keyframes atows-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes atows-word{from{opacity:0;transform:translateY(.5em) rotate(2deg)}to{opacity:1;transform:none}}
@keyframes atows-pop-in{from{opacity:0;transform:scale(.5) rotate(-12deg)}to{opacity:1;transform:none}}
@keyframes atows-blur-scale{from{opacity:0;transform:scale(.9);filter:blur(12px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes atows-ghost-in{from{opacity:0;transform:translateY(80px) rotate(-12deg) scale(.8)}to{opacity:1;transform:none}}
@keyframes atows-reveal{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes atows-fly{from{opacity:0;transform:translate(var(--fx,0px),var(--fy,0px)) rotate(var(--fr,0deg)) scale(var(--fs,1))}to{opacity:1;transform:none}}
@keyframes atows-pulse{0%{transform:scale(1)}45%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes atows-flash{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
@keyframes atows-bracket{from{opacity:0;transform:translate(var(--bx),var(--by))}to{opacity:1;transform:none}}
@keyframes atows-fade{from{opacity:0}to{opacity:1}}
@keyframes atows-idle{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@media (prefers-reduced-motion:reduce){
  .atows *,.atows *::before,.atows *::after{animation:none!important;transition:none!important}
  .atows .rv:not(.in) .rvi,.atows .build:not(.on) .frag,.atows .build:not(.on) .pair{opacity:1;transform:none}
  .atows .sweep{display:none}}
@media (max-width:900px){.atows .hero .wrap{grid-template-columns:1fr}.atows .logo{max-width:300px;padding:24px}.atows .grid3,.atows .osmap{grid-template-columns:1fr}.atows .eq.r2{flex-wrap:wrap}
  .atows .step{grid-template-columns:64px minmax(0,1fr)}.atows .step .num{width:64px;height:64px;font-size:26px}.atows .step .acts{grid-column:1/-1}.atows .wrap{padding:0 22px}}
`;
var R1 = [
  { fx: "-70px", fy: "0px", fr: "-5deg", dl: 0 },
  { fx: "70px", fy: "0px", fr: "5deg", dl: 70 }
];
var R1_PLUGIN = { fs: ".6", dl: 380 };
var R2_PLUGIN = { fy: "-46px", dl: 780 };
var R2 = [
  { fy: "110px", fr: "5deg", dl: 900 },
  { fy: "-110px", fr: "-4deg", dl: 980 },
  { fy: "120px", fr: "6deg", dl: 1060 },
  { fy: "-120px", fr: "-3deg", dl: 1140 }
];
var R2_APP = { fs: ".5", dl: 1320 };
var OS_DL = [2050, 2170, 2290];
var fly = (o) => ({ ["--fx"]: o.fx, ["--fy"]: o.fy, ["--fr"]: o.fr, ["--fs"]: o.fs, ["--dl"]: `${o.dl}ms` });
function Check({ checked, onChange, small, label }) {
  return /* @__PURE__ */ jsxs("span", { className: `cbox${small ? " sm" : ""}`, children: [
    /* @__PURE__ */ jsx("input", { type: "checkbox", checked, onChange, "aria-label": label }),
    /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M5 12.5l4.2 4.2L19 7" }) })
  ] });
}
function AtoWorkshop() {
  const theme = useTheme();
  const notify = useNotify();
  const { openChat } = useChatLauncher();
  const [setup, setSetup] = useState(() => store.get("setup", { c1: true }));
  const [done, setDone] = useState(() => store.get("done", {}));
  const [clone, setClone] = useState(() => store.get("clone", "~/ato-2026-dup-triage"));
  const [enter, setEnter] = useState(true);
  const [built, setBuilt] = useState(false);
  const [idle, setIdle] = useState(false);
  const rootRef = useRef(null);
  const whatRef = useRef(null);
  const trackRef = useRef(null);
  const ghostRef = useRef(null);
  const numRefs = useRef({});
  useEffect(() => {
    store.set("setup", setup);
  }, [setup]);
  useEffect(() => {
    store.set("done", done);
  }, [done]);
  useEffect(() => {
    store.set("clone", clone);
  }, [clone]);
  useEffect(() => {
    const t = setTimeout(() => setEnter(false), 2e3);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll("section.rv"));
    if (typeof IntersectionObserver === "undefined" || reducedMotion()) {
      sections.forEach((s) => s.classList.add("in"));
      setBuilt(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        if (e.target === whatRef.current) setBuilt(true);
        io.unobserve(e.target);
      }
    }, { threshold: 0.18 });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const el = trackRef.current;
    if (!el || reducedMotion() || typeof IntersectionObserver === "undefined") return;
    let onScreen = false;
    const update = () => setIdle(onScreen && document.visibilityState === "visible");
    const io = new IntersectionObserver((es) => {
      onScreen = es.some((e) => e.isIntersecting);
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const total = SETUP.length + STEPS.length;
  const count = SETUP.filter((c) => setup[c.id]).length + STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round(count / total * 100);
  const nextStep = useMemo(() => STEPS.find((s) => !done[s.id]), [done]);
  const toggleSetup = (id) => {
    const v = !setup[id];
    setSetup({ ...setup, [id]: v });
    if (v) hop(ghostRef.current);
  };
  const toggleDone = (s) => {
    const v = !done[s.id];
    setDone({ ...done, [s.id]: v });
    if (v) {
      hop(ghostRef.current);
      const num = numRefs.current[s.id];
      spark(num);
      pulse(num, 1.1);
    }
  };
  const openStep = (s) => openChat({ agent: GUIDE_AGENT, message: promptFor(s, clone.trim() || "~/ato-2026-dup-triage"), autoSend: true });
  const copyStep = async (s) => {
    const text = promptFor(s, clone.trim() || "~/ato-2026-dup-triage");
    try {
      await navigator.clipboard.writeText(text);
      notify("Prompt copied. Paste it into a workshop-guide chat.", { type: "success" });
    } catch {
      notify(text, { type: "info" });
    }
  };
  const titleLines = [["Build", "your", "first"], ["Kiro", "Crew", "app"]];
  let wi = 0;
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, className: `atows${enter ? " enter" : ""}`, "data-mode": isLight(theme.mode) ? "light" : "dark", children: [
    /* @__PURE__ */ jsx("style", { children: CSS }),
    /* @__PURE__ */ jsxs("header", { className: "hero", children: [
      /* @__PURE__ */ jsx("div", { className: "sweep", "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("div", { className: "rule", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxs("div", { className: "wrap", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "brandrow rise", style: { ["--d"]: ".05s" }, children: [
            /* @__PURE__ */ jsx("img", { src: asset("kirocrew-icon.png"), alt: "Kiro Crew" }),
            /* @__PURE__ */ jsxs("span", { className: "wordmark", children: [
              "KIRO CREW ",
              /* @__PURE__ */ jsx("span", { className: "x", "aria-hidden": "true", children: "\xD7" }),
              /* @__PURE__ */ jsx("span", { className: "sr", children: "at" }),
              " ALL THINGS OPEN 2026"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "eyebrow rise", style: { ["--d"]: ".12s" }, children: "Hands-on workshop \xB7 your guide" }),
          /* @__PURE__ */ jsx("h1", { "aria-label": "Build your first Kiro Crew app", children: titleLines.map((line, li) => /* @__PURE__ */ jsxs("span", { "aria-hidden": "true", children: [
            line.map((w) => {
              const d = `${0.18 + 0.07 * wi++}s`;
              return /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "w", style: { ["--d"]: d }, children: w }),
                " "
              ] }, w);
            }),
            li === 0 && /* @__PURE__ */ jsx("br", {})
          ] }, li)) }),
          /* @__PURE__ */ jsx("p", { className: "tag rise", style: { ["--d"]: ".6s" }, children: "An agentic software factory that turns GitHub issues into reviewed fixes" }),
          /* @__PURE__ */ jsx("ul", { className: "facts", "aria-label": "Session facts", children: ["Mon, Oct 19, 2026", "2:30\u20134:30 PM ET", "Room 304"].map((f, i) => /* @__PURE__ */ jsx("li", { style: { ["--d"]: `${0.7 + 0.07 * i}s` }, children: f }, f)) }),
          /* @__PURE__ */ jsxs("p", { className: "people rise", style: { ["--d"]: ".92s" }, children: [
            "With ",
            /* @__PURE__ */ jsx("b", { children: "Arundeep Nagaraj" }),
            ", ",
            /* @__PURE__ */ jsx("b", { children: "Bolin Chen" }),
            " and ",
            /* @__PURE__ */ jsx("b", { children: "Zezhen Xu" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "logo", children: /* @__PURE__ */ jsx("img", { src: asset("ato-full-white.png"), alt: "All Things Open 2026" }) })
      ] }),
      /* @__PURE__ */ jsx("img", { className: "ghost-hero", src: asset("ghosts/wave.svg"), alt: "", "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "track", ref: trackRef, role: "group", "aria-label": "Workshop progress", children: [
        /* @__PURE__ */ jsxs("div", { className: "lbl", children: [
          /* @__PURE__ */ jsx("span", { children: nextStep ? `Next: Step ${nextStep.n} \u2014 ${nextStep.title}` : "All steps done. Share your app!" }),
          /* @__PURE__ */ jsxs("span", { children: [
            count,
            " of ",
            total,
            " done"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bar", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": total, "aria-valuenow": count, "aria-label": `${count} of ${total} done`, children: [
          /* @__PURE__ */ jsx("div", { className: "fill", style: { transform: `scaleX(${pct / 100})` } }),
          /* @__PURE__ */ jsx("div", { className: "mtrack", style: { transform: `translateX(${pct}%)` }, "aria-hidden": "true", children: /* @__PURE__ */ jsx("div", { className: "marker", children: /* @__PURE__ */ jsx("span", { className: `float${idle ? " idle" : ""}`, children: /* @__PURE__ */ jsx("img", { ref: ghostRef, src: asset("ghosts/pose-5.svg"), alt: "" }) }) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sr", "aria-live": "polite", children: [
        count,
        " of ",
        total,
        " done"
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "s rv", "aria-labelledby": "setup-h", children: [
        /* @__PURE__ */ jsx("h2", { id: "setup-h", className: "rvi", children: "Before you start" }),
        /* @__PURE__ */ jsx("p", { className: "lead rvi", style: { ["--i"]: 1 }, children: "Four things. Tick each one when it is true." }),
        /* @__PURE__ */ jsx("div", { className: "grid3", children: SETUP.map((c, i) => /* @__PURE__ */ jsxs("div", { className: "card rvi", style: { ["--i"]: 2 + i }, children: [
          /* @__PURE__ */ jsxs("label", { className: "check", children: [
            /* @__PURE__ */ jsx(Check, { checked: !!setup[c.id], onChange: () => toggleSetup(c.id) }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("b", { children: c.title }),
              /* @__PURE__ */ jsx("span", { children: c.hint })
            ] })
          ] }),
          c.id === "c3" && /* @__PURE__ */ jsxs("div", { className: "field", children: [
            /* @__PURE__ */ jsxs("span", { className: "links", children: [
              /* @__PURE__ */ jsx("a", { href: `https://github.com/${BASE_REPO}`, target: "_blank", rel: "noreferrer", children: "Starter repo on GitHub \u2197" }),
              /* @__PURE__ */ jsx("a", { href: ZIP_URL, target: "_blank", rel: "noreferrer", children: "No git? Download ZIP \u2197" })
            ] }),
            /* @__PURE__ */ jsx("label", { htmlFor: "atows-clone", children: "Your folder" }),
            /* @__PURE__ */ jsx("input", { id: "atows-clone", value: clone, spellCheck: false, onChange: (e) => setClone(e.target.value) }),
            /* @__PURE__ */ jsxs("small", { children: [
              "Clone: ",
              /* @__PURE__ */ jsxs("code", { children: [
                "git clone https://github.com/",
                BASE_REPO,
                " ~/ato-2026-dup-triage"
              ] }),
              ". ZIP: unzip it, then use ",
              /* @__PURE__ */ jsx("code", { children: "~/Downloads/ato-2026-dup-triage-main" }),
              ". The guide works only in this folder."
            ] })
          ] })
        ] }, c.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "s rv", "aria-labelledby": "what-h", ref: whatRef, children: [
        /* @__PURE__ */ jsx("h2", { id: "what-h", className: "rvi", children: "What is a Kiro Crew app?" }),
        /* @__PURE__ */ jsx("p", { className: "lead rvi", style: { ["--i"]: 1 }, children: "Skills teach the agent. MCP connects tools. The page, timer and memory make it an app." }),
        /* @__PURE__ */ jsxs("div", { className: `build${built ? " on" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "eq r1", role: "group", "aria-label": "Skill plus MCP equals Agent plugin", children: [
            PLUGIN.map((t, i) => /* @__PURE__ */ jsxs("div", { className: "frag", style: fly(R1[i]), children: [
              i > 0 && /* @__PURE__ */ jsx("span", { className: "op", "aria-hidden": "true", children: "+" }),
              /* @__PURE__ */ jsxs("div", { className: "tile", children: [
                /* @__PURE__ */ jsx("b", { children: t.k }),
                /* @__PURE__ */ jsx("code", { children: t.code })
              ] })
            ] }, t.k)),
            /* @__PURE__ */ jsxs("div", { className: "frag", style: fly(R1_PLUGIN), children: [
              /* @__PURE__ */ jsx("span", { className: "op", "aria-hidden": "true", children: "=" }),
              /* @__PURE__ */ jsx("div", { className: "tile plug lit", style: { ["--pl"]: "980ms" }, children: /* @__PURE__ */ jsx("b", { children: "Agent plugin" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "eq r2", role: "group", "aria-label": "Agent plugin plus cron jobs, memory, harness API and UI bundle equals App", children: [
            /* @__PURE__ */ jsx("div", { className: "frag", style: fly(R2_PLUGIN), children: /* @__PURE__ */ jsx("div", { className: "tile plug", children: /* @__PURE__ */ jsx("b", { children: "Agent plugin" }) }) }),
            APP_PARTS.map((t, i) => /* @__PURE__ */ jsxs("div", { className: "frag", style: fly(R2[i]), children: [
              /* @__PURE__ */ jsx("span", { className: "op", "aria-hidden": "true", children: "+" }),
              /* @__PURE__ */ jsxs("div", { className: "tile", children: [
                /* @__PURE__ */ jsx("b", { children: t.k }),
                /* @__PURE__ */ jsx("code", { children: t.code })
              ] })
            ] }, t.k)),
            /* @__PURE__ */ jsxs("div", { className: "frag", style: fly(R2_APP), children: [
              /* @__PURE__ */ jsx("span", { className: "op", "aria-hidden": "true", children: "=" }),
              /* @__PURE__ */ jsxs("div", { className: "tile app", children: [
                /* @__PURE__ */ jsx("b", { children: "App" }),
                /* @__PURE__ */ jsx("span", { children: "your own UI" }),
                /* @__PURE__ */ jsx("i", { className: "br tl", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx("i", { className: "br tr", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx("i", { className: "br bl", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx("i", { className: "br br2", "aria-hidden": "true" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "osrow", children: [
            /* @__PURE__ */ jsx("h3", { children: "Kiro Crew = an Agent OS" }),
            /* @__PURE__ */ jsx("dl", { className: "osmap", children: OS_MAP.map(([l, r], i) => /* @__PURE__ */ jsxs("div", { className: "pair", style: { ["--dl"]: `${OS_DL[i]}ms` }, children: [
              /* @__PURE__ */ jsx("dt", { children: l }),
              /* @__PURE__ */ jsx("span", { className: "link", "aria-hidden": "true", children: /* @__PURE__ */ jsx("i", {}) }),
              /* @__PURE__ */ jsx("dd", { children: r })
            ] }, l)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("details", { className: "real", children: [
          /* @__PURE__ */ jsx("summary", { children: "Where each part is in Backlog Factory (Lab 3)" }),
          /* @__PURE__ */ jsx("ul", { children: [...PLUGIN, ...APP_PARTS].map((t) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: t.k }),
            " ",
            /* @__PURE__ */ jsx("code", { children: t.real })
          ] }, t.k)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "s rv", "aria-labelledby": "build-h", children: [
        /* @__PURE__ */ jsx("h2", { id: "build-h", className: "rvi", children: "Build your app" }),
        /* @__PURE__ */ jsx("p", { className: "lead rvi", style: { ["--i"]: 1 }, children: "Each button opens a new chat with this app\u2019s agent, your guide, and sends that step. It explains, then asks yes / no before it changes anything." }),
        /* @__PURE__ */ jsx("ol", { className: "steps", children: STEPS.map((s, i) => /* @__PURE__ */ jsxs("li", { className: `card step rvi${done[s.id] ? " done" : ""}`, style: { ["--i"]: 2 + i }, children: [
          /* @__PURE__ */ jsxs("div", { className: "num", ref: (el) => {
            numRefs.current[s.id] = el;
          }, "aria-hidden": "true", children: [
            done[s.id] ? "\u2713" : s.n,
            /* @__PURE__ */ jsx("img", { src: asset(`ghosts/${s.ghost}`), alt: "" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              "Step ",
              s.n,
              ". ",
              s.title,
              s.lab && /* @__PURE__ */ jsx("span", { className: "lab", children: s.lab })
            ] }),
            /* @__PURE__ */ jsx("p", { children: s.does }),
            /* @__PURE__ */ jsxs("p", { className: "see", children: [
              /* @__PURE__ */ jsx("b", { children: "You should see:" }),
              " ",
              s.see
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "acts", children: [
            /* @__PURE__ */ jsx("button", { className: "btn", onClick: () => openStep(s), children: "Open guide chat \u2192" }),
            /* @__PURE__ */ jsx("button", { className: "btn ghostbtn", onClick: () => copyStep(s), children: "Copy prompt" }),
            /* @__PURE__ */ jsxs("label", { className: "donebox", children: [
              /* @__PURE__ */ jsx(Check, { small: true, checked: !!done[s.id], onChange: () => toggleDone(s) }),
              "Done",
              /* @__PURE__ */ jsxs("span", { className: "sr", children: [
                " with step ",
                s.n
              ] })
            ] })
          ] })
        ] }, s.id)) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "s rv", "aria-labelledby": "safe-h", children: /* @__PURE__ */ jsxs("div", { className: "card boundary rvi", children: [
        /* @__PURE__ */ jsx("img", { src: asset("ghosts/pose-8.svg"), alt: "", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { id: "safe-h", style: { fontSize: 26 }, children: "What your guide (this app\u2019s agent) will and won\u2019t do" }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsx("li", { children: "It types for you: copies files, writes your skill, runs the install." }),
            /* @__PURE__ */ jsxs("li", { children: [
              "It asks ",
              /* @__PURE__ */ jsx("b", { children: "yes / no" }),
              " before every change."
            ] }),
            /* @__PURE__ */ jsx("li", { children: "It never writes to GitHub. Today everything stays in your folder." }),
            /* @__PURE__ */ jsx("li", { children: "You trust and enable each app yourself, in Library." })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "s rv", "aria-labelledby": "share-h", children: /* @__PURE__ */ jsxs("div", { className: "card rvi", children: [
        /* @__PURE__ */ jsx("h2", { id: "share-h", style: { fontSize: 26 }, children: "Install this app on another laptop" }),
        /* @__PURE__ */ jsxs("p", { className: "see", children: [
          "Install from GitHub. No sign-in needed; the laptop needs ",
          /* @__PURE__ */ jsx("code", { children: "git" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("ol", { className: "howto", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "Discover" }),
            " \u2192 database icon (",
            /* @__PURE__ */ jsx("b", { children: "Manage app sources" }),
            ") \u2192 ",
            /* @__PURE__ */ jsx("b", { children: "Add Registry" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Repo: ",
            /* @__PURE__ */ jsxs("code", { children: [
              "https://github.com/",
              BASE_REPO
            ] }),
            " \u2192 ",
            /* @__PURE__ */ jsx("b", { children: "Add Registry" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Search ",
            /* @__PURE__ */ jsx("b", { children: "ATO 2026" }),
            " \u2192 ",
            /* @__PURE__ */ jsx("b", { children: "Install" }),
            " \u2192 ",
            /* @__PURE__ */ jsx("b", { children: "Trust this app and enable" }),
            ", then press ",
            /* @__PURE__ */ jsx("b", { children: "Enable" }),
            " on the app page"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "see", children: [
          /* @__PURE__ */ jsx("b", { children: "No git? Download ZIP:" }),
          " ",
          /* @__PURE__ */ jsx("a", { href: ZIP_URL, target: "_blank", rel: "noreferrer", children: "the repo as a ZIP \u2197" }),
          ", unzip it, then ",
          /* @__PURE__ */ jsx("b", { children: "Install from Path" }),
          " in the same menu with its ",
          /* @__PURE__ */ jsx("code", { children: "ato-2026-workshop" }),
          " folder, and trust and enable it in ",
          /* @__PURE__ */ jsx("b", { children: "Library" }),
          "."
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("footer", { children: [
        "Starter repo: ",
        /* @__PURE__ */ jsxs("a", { href: `https://github.com/${BASE_REPO}`, target: "_blank", rel: "noreferrer", children: [
          "github.com/",
          BASE_REPO
        ] }),
        " ",
        "\xB7 #AllThingsOpen"
      ] })
    ] })
  ] });
}
export {
  AtoWorkshop as default
};
