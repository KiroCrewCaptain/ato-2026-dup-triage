// ATO 2026 Workshop — the guide page.
//
// One self-contained page: a dark ATO 2026 hero, the setup checklist, "what is
// an app", and the build steps. Each step button opens a NEW chat on this app's
// own agent (workshop-guide) and sends that step's prompt. Nothing changes on
// disk until the person answers yes: the guide asks first (skill rule 1).
// (A draft-only launch, autoSend:false, drops the text on 0.9.0.)
// Assets (logos, ghosts, fonts) ship in
// ui/dist/assets and load from this module's own URL: no CDN, works offline.
import { useChatLauncher, useNotify, useTheme } from '@kirocrew/app-sdk'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { hop, pulse, reducedMotion, spark } from './motion'

const APP = 'ato-2026-workshop'
const GUIDE_AGENT = 'workshop-guide'
const BASE_REPO = 'KiroCrewCaptain/ato-2026-dup-triage'
const asset = (f: string) => new URL(`./assets/${f}`, import.meta.url).href

// useTheme() re-renders on a theme change, but on 0.9.0 its `mode` is the raw
// data-theme value (for example "kiro-light"). The host also sets data-mode to
// the resolved "light" / "dark", so read that first.
function isLight(sdkMode: string): boolean {
  const resolved = typeof document !== 'undefined' ? document.documentElement.dataset.mode : ''
  if (resolved === 'light' || resolved === 'dark') return resolved === 'light'
  return /light/.test(sdkMode || '')
}

type Step = {
  id: string
  n: number
  lab?: string
  title: string
  does: string
  see: string
  ghost: string
}

const STEPS: Step[] = [
  { id: 's1', n: 1, title: 'Check your setup', ghost: 'pose-1.svg',
    does: 'The guide looks at your repo folder, Python, git and the kirocrew command. It only reads.',
    see: 'A short checklist that ends with “All set, press Step 2”.' },
  { id: 's2', n: 2, lab: 'Lab 1', title: 'Build your app', ghost: 'pose-3.svg',
    does: 'The guide copies Lab 1 into backlog-factory/ and installs your app, after your yes.',
    see: 'Backlog Factory in the sidebar, after you trust and enable it in Library.' },
  { id: 's3', n: 3, lab: 'Lab 1', title: 'Sort the backlog', ghost: 'pose-5.svg',
    does: 'Press Run now on your app’s page. Its agent asks: good problem? five whys? first principles?',
    see: 'A board with lanes and counts. Each card has a verdict and a one-line reason.' },
  { id: 's4', n: 4, lab: 'Lab 2', title: 'Reproduce with helpers', ghost: 'pose-7.svg',
    does: 'Your app splits the bugs across helper agents. Each runs jot in your folder and pastes the real output.',
    see: 'Bugs with a real command and output. Each helper waits for your Allow.' },
  { id: 's5', n: 5, lab: 'Lab 3', title: 'Fix ⇄ Review', ghost: 'pose-8.svg',
    does: 'A fixer and a separate reviewer loop on a local branch until the review is green. Needs git.',
    see: 'A card in Ready to merge. You read the diff and you merge.' },
  { id: 's6', n: 6, title: 'Remix it into your idea', ghost: 'wave.svg',
    does: 'Tell the guide your rule or lane. It edits your app’s skill and reinstalls.',
    see: 'Your own rule on the board after the next Run now.' },
  { id: 's7', n: 7, title: 'Share it', ghost: 'pose-1.svg',
    does: 'The guide zips your app folder. Nothing goes to GitHub today.',
    see: 'backlog-factory.zip. A friend installs it with Install from Path.' },
]

const SETUP = [
  { id: 'c1', title: 'Kiro Crew installed', hint: 'You are reading this page, so yes.' },
  { id: 'c2', title: 'Signed in', hint: 'The Set up Kiro page is done and a chat answers.' },
  { id: 'c3', title: 'Repo cloned (or ZIP downloaded)', hint: 'git clone the starter repo into ~/ato-2026-dup-triage. No git? Download the ZIP and unzip it: ato-2026-dup-triage-main.' },
  { id: 'c4', title: 'Python 3.9 or newer', hint: 'The factory runs jot to reproduce bugs. Check: python3 --version (Windows: py --version).' },
]

// "What is an app?" — the owner's model, same labels as the deck (slides 3-4).
// The real Lab 3 part sits under each label.
const PLUGIN = [
  { k: 'Skill', code: 'skills/', real: 'skills/factory-triage' },
  { k: 'MCP', code: 'mcpServers', real: 'optional: none of its own' },
]
const APP_PARTS = [
  { k: 'Cron jobs', code: 'crons', real: 'factory-weekday, paused' },
  { k: 'Memory', code: 'board file', real: 'factory/board.json' },
  { k: 'Harness API', code: '@kirocrew-core', real: 'spawn_run · spawn_continue' },
  { k: 'UI bundle', code: 'ui/dist + backend', real: 'the board page' },
]
const OS_MAP = [
  ['OS', 'Kiro Crew'],
  ['App', 'Your Kiro Crew app'],
  ['App store', 'Discover · Library'],
]

const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem(`${APP}:${k}`); return v === null ? d : (JSON.parse(v) as T) } catch { return d }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(`${APP}:${k}`, JSON.stringify(v)) } catch { /* private mode */ } },
}

function promptFor(step: Step, clone: string) {
  const lab = step.lab ? ` (${step.lab})` : ''
  return `STEP ${step.n} — ${step.title}${lab}. My clone folder: ${clone}. ` +
    'Follow the workshop-guide skill for this step. Ask me yes/no before you change anything.'
}

const ZIP_URL = `https://github.com/${BASE_REPO}/archive/refs/heads/main.zip`

// Motion values ported from the frontend-slides animation patterns (reveal,
// reveal-blur, reveal-scale, stagger, gradient mesh) and video-shotcraft
// (EASE presets, damping-15 overshoot, 2f ≈ 70 ms stagger, fly-in with a few
// degrees of start rotation, one merge pulse + one outline flash, corner brackets
// that converge on the subject, a single spotlight sweep). Transform and opacity
// only, except two short blur entrances. Nothing loops except the guide ghost's
// slow idle float, which runs only while the track is on screen and the tab is
// visible. prefers-reduced-motion: no motion, final frames shown.
const CSS = `
@font-face{font-family:"ATO Space Grotesk";font-weight:400 700;font-display:swap;src:url("${asset('fonts/SpaceGrotesk-latin.woff2')}") format("woff2")}
@font-face{font-family:"ATO JetBrains Mono";font-weight:400 500;font-display:swap;src:url("${asset('fonts/JetBrainsMono-latin.woff2')}") format("woff2")}
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
`

// Fly-in start offsets for the build-up (scanline-assemble-flyin: from off-slot,
// a few degrees of start rotation, overshoot into place). Delays in ms.
const R1 = [
  { fx: '-70px', fy: '0px', fr: '-5deg', dl: 0 },
  { fx: '70px', fy: '0px', fr: '5deg', dl: 70 },
]
const R1_PLUGIN = { fs: '.6', dl: 380 }
const R2_PLUGIN = { fy: '-46px', dl: 780 }
const R2 = [
  { fy: '110px', fr: '5deg', dl: 900 },
  { fy: '-110px', fr: '-4deg', dl: 980 },
  { fy: '120px', fr: '6deg', dl: 1060 },
  { fy: '-120px', fr: '-3deg', dl: 1140 },
]
const R2_APP = { fs: '.5', dl: 1320 }
const OS_DL = [2050, 2170, 2290]

const fly = (o: { fx?: string; fy?: string; fr?: string; fs?: string; dl: number }) =>
  ({ ['--fx' as string]: o.fx, ['--fy' as string]: o.fy, ['--fr' as string]: o.fr, ['--fs' as string]: o.fs, ['--dl' as string]: `${o.dl}ms` })

function Check({ checked, onChange, small, label }: { checked: boolean; onChange: () => void; small?: boolean; label?: string }) {
  return (
    <span className={`cbox${small ? ' sm' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} />
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
    </span>
  )
}

export default function AtoWorkshop() {
  const theme = useTheme()
  const notify = useNotify()
  const { openChat } = useChatLauncher()
  const [setup, setSetup] = useState<Record<string, boolean>>(() => store.get('setup', { c1: true }))
  const [done, setDone] = useState<Record<string, boolean>>(() => store.get('done', {}))
  const [clone, setClone] = useState<string>(() => store.get('clone', '~/ato-2026-dup-triage'))
  const [enter, setEnter] = useState(true)
  const [built, setBuilt] = useState(false)
  const [idle, setIdle] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const whatRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLImageElement>(null)
  const numRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => { store.set('setup', setup) }, [setup])
  useEffect(() => { store.set('done', done) }, [done])
  useEffect(() => { store.set('clone', clone) }, [clone])
  // The hero entrance plays once on load, then the page rests on its final frame.
  useEffect(() => { const t = setTimeout(() => setEnter(false), 2000); return () => clearTimeout(t) }, [])

  // Sections reveal once as they scroll into view; the build-up plays once.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sections = Array.from(root.querySelectorAll<HTMLElement>('section.rv'))
    if (typeof IntersectionObserver === 'undefined' || reducedMotion()) {
      sections.forEach((s) => s.classList.add('in')); setBuilt(true); return
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('in')
        if (e.target === whatRef.current) setBuilt(true)
        io.unobserve(e.target)
      }
    }, { threshold: 0.18 })
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // The one idle motion: the guide ghost floats (<= 3 px, 5 s) only while the
  // track is on screen and the tab is visible.
  useEffect(() => {
    const el = trackRef.current
    if (!el || reducedMotion() || typeof IntersectionObserver === 'undefined') return
    let onScreen = false
    const update = () => setIdle(onScreen && document.visibilityState === 'visible')
    const io = new IntersectionObserver((es) => { onScreen = es.some((e) => e.isIntersecting); update() })
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  const total = SETUP.length + STEPS.length
  const count = SETUP.filter((c) => setup[c.id]).length + STEPS.filter((s) => done[s.id]).length
  const pct = Math.round((count / total) * 100)
  const nextStep = useMemo(() => STEPS.find((s) => !done[s.id]), [done])

  const toggleSetup = (id: string) => {
    const v = !setup[id]
    setSetup({ ...setup, [id]: v })
    if (v) hop(ghostRef.current)
  }
  const toggleDone = (s: Step) => {
    const v = !done[s.id]
    setDone({ ...done, [s.id]: v })
    if (v) {
      hop(ghostRef.current)
      const num = numRefs.current[s.id]
      spark(num)
      pulse(num, 1.1)
    }
  }
  const openStep = (s: Step) => openChat({ agent: GUIDE_AGENT, message: promptFor(s, clone.trim() || '~/ato-2026-dup-triage'), autoSend: true })
  const copyStep = async (s: Step) => {
    const text = promptFor(s, clone.trim() || '~/ato-2026-dup-triage')
    try { await navigator.clipboard.writeText(text); notify('Prompt copied. Paste it into a workshop-guide chat.', { type: 'success' }) }
    catch { notify(text, { type: 'info' }) }
  }

  const titleLines = [['Build', 'your', 'first'], ['Kiro', 'Crew', 'app']]
  let wi = 0

  return (
    <div ref={rootRef} className={`atows${enter ? ' enter' : ''}`} data-mode={isLight(theme.mode) ? 'light' : 'dark'}>
      <style>{CSS}</style>
      <header className="hero">
        <div className="sweep" aria-hidden="true" />
        <div className="rule" aria-hidden="true" />
        <div className="wrap">
          <div>
            <div className="brandrow rise" style={{ ['--d' as string]: '.05s' }}>
              <img src={asset('kirocrew-icon.png')} alt="Kiro Crew" />
              <span className="wordmark">KIRO CREW <span className="x" aria-hidden="true">×</span><span className="sr">at</span> ALL THINGS OPEN 2026</span>
            </div>
            <div className="eyebrow rise" style={{ ['--d' as string]: '.12s' }}>Hands-on workshop · your guide</div>
            <h1 aria-label="Build your first Kiro Crew app">
              {titleLines.map((line, li) => (
                <span key={li} aria-hidden="true">
                  {line.map((w) => {
                    const d = `${0.18 + 0.07 * wi++}s`
                    return <Fragment key={w}><span className="w" style={{ ['--d' as string]: d }}>{w}</span>{' '}</Fragment>
                  })}
                  {li === 0 && <br />}
                </span>
              ))}
            </h1>
            <p className="tag rise" style={{ ['--d' as string]: '.6s' }}>An agentic software factory that turns GitHub issues into reviewed fixes</p>
            <ul className="facts" aria-label="Session facts">
              {['Mon, Oct 19, 2026', '2:30–4:30 PM ET', 'Room 304'].map((f, i) => (
                <li key={f} style={{ ['--d' as string]: `${0.7 + 0.07 * i}s` }}>{f}</li>
              ))}
            </ul>
            <p className="people rise" style={{ ['--d' as string]: '.92s' }}>
              With <b>Arundeep Nagaraj</b>, <b>Bolin Chen</b> and <b>Zezhen Xu</b>
            </p>
          </div>
          <div className="logo"><img src={asset('ato-full-white.png')} alt="All Things Open 2026" /></div>
        </div>
        <img className="ghost-hero" src={asset('ghosts/wave.svg')} alt="" aria-hidden="true" />
      </header>

      <div className="wrap">
        <div className="track" ref={trackRef} role="group" aria-label="Workshop progress">
          <div className="lbl">
            <span>{nextStep ? `Next: Step ${nextStep.n} — ${nextStep.title}` : 'All steps done. Share your app!'}</span>
            <span>{count} of {total} done</span>
          </div>
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count} aria-label={`${count} of ${total} done`}>
            <div className="fill" style={{ transform: `scaleX(${pct / 100})` }} />
            <div className="mtrack" style={{ transform: `translateX(${pct}%)` }} aria-hidden="true">
              <div className="marker">
                <span className={`float${idle ? ' idle' : ''}`}><img ref={ghostRef} src={asset('ghosts/pose-5.svg')} alt="" /></span>
              </div>
            </div>
          </div>
        </div>
        <div className="sr" aria-live="polite">{count} of {total} done</div>

        <section className="s rv" aria-labelledby="setup-h">
          <h2 id="setup-h" className="rvi">Before you start</h2>
          <p className="lead rvi" style={{ ['--i' as string]: 1 }}>Four things. Tick each one when it is true.</p>
          <div className="grid3">
            {SETUP.map((c, i) => (
              <div className="card rvi" key={c.id} style={{ ['--i' as string]: 2 + i }}>
                <label className="check">
                  <Check checked={!!setup[c.id]} onChange={() => toggleSetup(c.id)} />
                  <span><b>{c.title}</b><span>{c.hint}</span></span>
                </label>
                {c.id === 'c3' && (
                  <div className="field">
                    <span className="links">
                      <a href={`https://github.com/${BASE_REPO}`} target="_blank" rel="noreferrer">Starter repo on GitHub ↗</a>
                      <a href={ZIP_URL} target="_blank" rel="noreferrer">No git? Download ZIP ↗</a>
                    </span>
                    <label htmlFor="atows-clone">Your folder</label>
                    <input id="atows-clone" value={clone} spellCheck={false} onChange={(e) => setClone(e.target.value)} />
                    <small>Clone: <code>git clone https://github.com/{BASE_REPO} ~/ato-2026-dup-triage</code>. ZIP: unzip it, then use <code>~/Downloads/ato-2026-dup-triage-main</code>. The guide works only in this folder.</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="s rv" aria-labelledby="what-h" ref={whatRef}>
          <h2 id="what-h" className="rvi">What is a Kiro Crew app?</h2>
          <p className="lead rvi" style={{ ['--i' as string]: 1 }}>Skill and MCP make an agent plugin. Add the rest, and it is an app.</p>
          <div className={`build${built ? ' on' : ''}`}>
            <div className="eq r1" role="group" aria-label="Skill plus MCP equals Agent plugin">
              {PLUGIN.map((t, i) => (
                <div className="frag" key={t.k} style={fly(R1[i])}>
                  {i > 0 && <span className="op" aria-hidden="true">+</span>}
                  <div className="tile"><b>{t.k}</b><code>{t.code}</code></div>
                </div>
              ))}
              <div className="frag" style={fly(R1_PLUGIN)}>
                <span className="op" aria-hidden="true">=</span>
                <div className="tile plug lit" style={{ ['--pl' as string]: '980ms' }}><b>Agent plugin</b></div>
              </div>
            </div>
            <div className="eq r2" role="group" aria-label="Agent plugin plus cron jobs, memory, harness API and UI bundle equals App">
              <div className="frag" style={fly(R2_PLUGIN)}>
                <div className="tile plug"><b>Agent plugin</b></div>
              </div>
              {APP_PARTS.map((t, i) => (
                <div className="frag" key={t.k} style={fly(R2[i])}>
                  <span className="op" aria-hidden="true">+</span>
                  <div className="tile"><b>{t.k}</b><code>{t.code}</code></div>
                </div>
              ))}
              <div className="frag" style={fly(R2_APP)}>
                <span className="op" aria-hidden="true">=</span>
                <div className="tile app">
                  <b>App</b><span>your own UI</span>
                  <i className="br tl" aria-hidden="true" /><i className="br tr" aria-hidden="true" />
                  <i className="br bl" aria-hidden="true" /><i className="br br2" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="osrow">
              <h3>Kiro Crew = an Agent OS</h3>
              <dl className="osmap">
                {OS_MAP.map(([l, r], i) => (
                  <div className="pair" key={l} style={{ ['--dl' as string]: `${OS_DL[i]}ms` }}>
                    <dt>{l}</dt>
                    <span className="link" aria-hidden="true"><i /></span>
                    <dd>{r}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <details className="real">
            <summary>Where each part is in Backlog Factory (Lab 3)</summary>
            <ul>
              {[...PLUGIN, ...APP_PARTS].map((t) => (
                <li key={t.k}><b>{t.k}</b> <code>{t.real}</code></li>
              ))}
            </ul>
          </details>
        </section>

        <section className="s rv" aria-labelledby="build-h">
          <h2 id="build-h" className="rvi">Build your app</h2>
          <p className="lead rvi" style={{ ['--i' as string]: 1 }}>Each button opens a new chat with this app’s agent, your guide, and sends that step. It explains, then asks yes / no before it changes anything.</p>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.id} className={`card step rvi${done[s.id] ? ' done' : ''}`} style={{ ['--i' as string]: 2 + i }}>
                <div className="num" ref={(el) => { numRefs.current[s.id] = el }} aria-hidden="true">
                  {done[s.id] ? '✓' : s.n}
                  <img src={asset(`ghosts/${s.ghost}`)} alt="" />
                </div>
                <div>
                  <h3>Step {s.n}. {s.title}{s.lab && <span className="lab">{s.lab}</span>}</h3>
                  <p>{s.does}</p>
                  <p className="see"><b>You should see:</b> {s.see}</p>
                </div>
                <div className="acts">
                  <button className="btn" onClick={() => openStep(s)}>Open guide chat →</button>
                  <button className="btn ghostbtn" onClick={() => copyStep(s)}>Copy prompt</button>
                  <label className="donebox">
                    <Check small checked={!!done[s.id]} onChange={() => toggleDone(s)} />
                    Done<span className="sr"> with step {s.n}</span>
                  </label>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="s rv" aria-labelledby="safe-h">
          <div className="card boundary rvi">
            <img src={asset('ghosts/pose-8.svg')} alt="" aria-hidden="true" />
            <div>
              <h2 id="safe-h" style={{ fontSize: 26 }}>What your guide (this app’s agent) will and won’t do</h2>
              <ul>
                <li>It types for you: copies files, writes your skill, runs the install.</li>
                <li>It asks <b>yes / no</b> before every change.</li>
                <li>It never writes to GitHub. Today everything stays in your folder.</li>
                <li>You trust and enable each app yourself, in Library.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="s rv" aria-labelledby="share-h">
          <div className="card rvi">
            <h2 id="share-h" style={{ fontSize: 26 }}>Install this app on another laptop</h2>
            <p className="see">From GitHub, about 20 seconds. No GitHub sign-in; the laptop needs <code>git</code>.</p>
            <ol className="howto">
              <li><b>Discover</b> → database icon (<b>Manage app sources</b>) → <b>Add Registry</b></li>
              <li>Repo: <code>https://github.com/{BASE_REPO}</code> → <b>Add Registry</b></li>
              <li>Search <b>ATO 2026</b> → <b>Install</b> → <b>Trust this app and enable</b>, then press <b>Enable</b> on the app page</li>
            </ol>
            <p className="see"><b>No git? Download ZIP:</b> <a href={ZIP_URL} target="_blank" rel="noreferrer">the repo as a ZIP ↗</a>, unzip it, then <b>Install from Path</b> in the same menu with its <code>ato-2026-workshop</code> folder, and trust and enable it in <b>Library</b>.</p>
          </div>
        </section>

        <footer>
          Starter repo: <a href={`https://github.com/${BASE_REPO}`} target="_blank" rel="noreferrer">github.com/{BASE_REPO}</a>
          {' '}· #AllThingsOpen
        </footer>
      </div>
    </div>
  )
}
