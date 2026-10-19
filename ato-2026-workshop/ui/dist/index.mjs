// src/App.tsx
import { useChatLauncher, useNotify, useTheme } from "@kirocrew/app-sdk";
import { useEffect, useMemo, useRef, useState } from "react";
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
    does: "The guide looks at your clone, your fork and the kirocrew command. It only reads.",
    see: "A short checklist that ends with \u201CAll set, press Step 2\u201D."
  },
  {
    id: "s2",
    n: 2,
    lab: "Lab 1",
    title: "Build your app",
    ghost: "pose-3.svg",
    does: "The guide copies Lab 1 into dup-triage/ and installs it, after your yes.",
    see: "Dup Detective in Apps \u2192 Library. You trust and enable it there."
  },
  {
    id: "s3",
    n: 3,
    lab: "Lab 1",
    title: "First run and check",
    ghost: "pose-5.svg",
    does: "You run your app in its own chat. The guide scores the report against the answer key.",
    see: "dup-triage-report.md with duplicate groups, each with a quote from both issues."
  },
  {
    id: "s4",
    n: 4,
    lab: "Lab 2",
    title: "Memory and helpers",
    ghost: "pose-7.svg",
    does: "Your app learns to remember verdicts and to split work across helper agents.",
    see: "The second run says \u201CN reused\u201D. Each helper waits for your Allow."
  },
  {
    id: "s5",
    n: 5,
    lab: "Lab 3",
    title: "Schedule, boundary and a page",
    ghost: "pose-8.svg",
    does: "A paused weekday schedule, a post-only-on-your-fork rule, and a page of its own.",
    see: "A Dup Detective page in the sidebar. The schedule shows Paused."
  },
  {
    id: "s6",
    n: 6,
    title: "Remix it into your idea",
    ghost: "wave.svg",
    does: "Tell the guide your idea. It writes a new skill into your app and reinstalls.",
    see: "Your own skill in the app. Try it in a dup-triage chat."
  },
  {
    id: "s7",
    n: 7,
    title: "Share it",
    ghost: "pose-1.svg",
    does: "The guide commits your app on a branch. You push it to your fork yourself.",
    see: "Your app in your fork. A friend installs it from their clone."
  }
];
var SETUP = [
  { id: "c1", title: "Kiro Crew installed", hint: "You are reading this page, so yes." },
  { id: "c2", title: "Signed in", hint: "The Set up Kiro page is done and a chat answers." },
  { id: "c3", title: "Your fork, cloned", hint: "Fork the starter repo on GitHub, then clone your fork." }
];
var CONCEPTS = [
  {
    k: "Skill",
    tag: "the rules",
    body: "A Markdown file of rules an agent reads. It says how to do one job.",
    eg: "skills/dup-triage/SKILL.md"
  },
  {
    k: "MCP",
    tag: "the hands",
    body: "A tool server. It gives an agent new actions, like reading an API.",
    eg: "a GitHub or database server"
  },
  {
    k: "App",
    tag: "the whole job",
    body: "One folder you install: agent, skills, tools, schedule, page and limits. You trust it once.",
    eg: "this page is an app"
  }
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
var CSS = `
@font-face{font-family:"ATO Space Grotesk";font-weight:400 700;font-display:swap;src:url("${asset("fonts/SpaceGrotesk-latin.woff2")}") format("woff2")}
@font-face{font-family:"ATO JetBrains Mono";font-weight:400 500;font-display:swap;src:url("${asset("fonts/JetBrainsMono-latin.woff2")}") format("woff2")}
.atows{--red:#EA3A40;--red-dk:#B8283D;--kc:#8E48FF;--kc-2:#844CF5;--night:#140b23;--black:#140b15;
  --ease:cubic-bezier(.16,1,.3,1);--sans:"ATO Space Grotesk","Space Grotesk",system-ui,sans-serif;--mono:"ATO JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;
  height:100%;overflow-y:auto;font-family:var(--sans);font-size:18px;line-height:1.5;-webkit-font-smoothing:antialiased}
.atows[data-mode=dark]{--bg:#0f0819;--ink:#f6f0fa;--muted:#c3b8d2;--card:rgba(255,255,255,.045);--line:rgba(255,255,255,.12);--accent-text:#ff7a7f;--kc-text:#c4a6ff;--field:#1b1029}
.atows[data-mode=light]{--bg:#f7f4fb;--ink:#1b1225;--muted:#4f4560;--card:#ffffff;--line:rgba(27,18,37,.14);--accent-text:#B8283D;--kc-text:#6a2fd6;--field:#ffffff}
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
.atows .rule{position:absolute;left:0;top:0;height:6px;width:100%;background:linear-gradient(90deg,var(--red) 0%,var(--red) 30%,var(--kc) 100%);transform-origin:left}
.atows .hero .wrap{position:relative;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:48px;align-items:center;padding-top:64px;padding-bottom:56px}
.atows .brandrow{display:flex;align-items:center;gap:14px;margin-bottom:22px}
.atows .brandrow img{width:52px;height:52px;border-radius:13px}
.atows .wordmark{font-weight:700;letter-spacing:.08em;font-size:17px}
.atows .x{color:#ff7a7f;font-weight:700}
.atows .eyebrow{font-family:var(--mono);font-size:15px;letter-spacing:.06em;color:#c3b8d2;text-transform:uppercase}
.atows h1{font-size:clamp(40px,4.6vw,64px);line-height:1.04;letter-spacing:-.02em;margin:0 0 14px;font-weight:700}
.atows .tag{font-size:clamp(22px,2.2vw,30px);line-height:1.2;color:#ff6a70;font-weight:600;margin:0 0 26px}
.atows .facts{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 22px;padding:0;list-style:none}
.atows .facts li{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);border-radius:999px;padding:8px 16px;font-size:17px;font-weight:600}
.atows .people{color:#d8cfe4;font-size:17px;margin:0}
.atows .people b{color:#fff}
.atows .logo{justify-self:center;padding:48px;max-width:440px;width:100%}
.atows .logo img{display:block;width:100%;height:auto}
.atows .ghost-hero{position:absolute;right:4%;bottom:-18px;width:120px;height:auto;filter:drop-shadow(0 10px 30px rgba(142,72,255,.45))}
/* progress track */
.atows .track{position:relative;margin:34px 0 0}
.atows .track .lbl{display:flex;justify-content:space-between;font-size:16px;color:var(--muted);margin-bottom:10px;font-weight:600}
.atows .bar{position:relative;height:14px;border-radius:999px;background:var(--line);overflow:visible}
.atows .fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--red-dk),var(--red) 35%,var(--kc));transition:width .9s var(--ease)}
.atows .marker{position:absolute;top:50%;width:44px;height:44px;margin:-26px 0 0 -22px;transition:left .9s var(--ease)}
.atows .marker img{width:100%;height:100%}
.atows .marker.hop img{animation:atows-hop .7s var(--ease) 1}
/* sections */
.atows section.s{padding:52px 0 8px}
.atows h2{font-size:34px;letter-spacing:-.01em;margin:0 0 6px}
.atows .lead{color:var(--muted);margin:0 0 24px;font-size:19px}
.atows .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.atows .card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px;transition:box-shadow .3s var(--ease),border-color .3s var(--ease),transform .3s var(--ease)}
.atows .card:hover,.atows .card:focus-within{border-color:rgba(142,72,255,.7);box-shadow:0 0 0 1px rgba(142,72,255,.35),0 18px 50px -18px rgba(234,58,64,.45),0 10px 40px -20px rgba(142,72,255,.7)}
.atows .check{display:flex;gap:14px;align-items:flex-start;cursor:pointer}
.atows .check input{width:26px;height:26px;margin:3px 0 0;accent-color:var(--kc);flex:none}
.atows .check b{display:block;font-size:20px}
.atows .check span{color:var(--muted);font-size:17px}
.atows .field{margin-top:18px;display:grid;gap:8px}
.atows .field label{font-weight:700;font-size:17px}
.atows .field input{font:500 18px var(--mono);padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--field);color:var(--ink);width:100%}
.atows .field small{color:var(--muted);font-size:15px}
.atows .concept .k{font-size:30px;font-weight:700;margin:0}
.atows .concept .t{font-family:var(--mono);font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-text);margin:2px 0 12px}
.atows .concept p{margin:0 0 12px}
.atows .concept code{font-family:var(--mono);font-size:15px;color:var(--muted)}
.atows .concept.app{border-color:rgba(142,72,255,.55);background:linear-gradient(160deg,rgba(142,72,255,.16),rgba(234,58,64,.08)),var(--card)}
.atows .concept.app .t{color:var(--kc-text)}
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
.atows .step.done .num.pulse{animation:atows-pop .6s var(--ease) 1}
.atows .btn{font:700 18px var(--sans);border:0;border-radius:14px;padding:14px 20px;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--red-dk),var(--kc));box-shadow:0 8px 24px -10px rgba(142,72,255,.8);transition:transform .2s var(--ease),box-shadow .2s var(--ease)}
.atows .btn:hover{transform:translateY(-1px);box-shadow:0 12px 30px -10px rgba(234,58,64,.8)}
.atows .btn.ghostbtn{background:transparent;color:var(--ink);border:1px solid var(--line);box-shadow:none;font-size:16px;padding:10px 16px}
.atows .donebox{display:flex;align-items:center;gap:8px;justify-content:center;font-size:16px;color:var(--muted);cursor:pointer}
.atows .donebox input{width:20px;height:20px;accent-color:var(--kc)}
.atows .boundary{display:grid;grid-template-columns:auto minmax(0,1fr);gap:22px;align-items:center}
.atows .boundary img{width:86px;height:auto}
.atows .boundary ul{margin:0;padding-left:22px}
.atows .boundary li{margin:4px 0}
.atows footer{padding:40px 0 56px;color:var(--muted);font-size:16px}
.atows .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
/* entrance: short, once, then rest */
.atows.enter .rule{animation:atows-rule .9s var(--ease) both}
.atows.enter .rise{animation:atows-rise .7s var(--ease) both;animation-delay:var(--d,0s)}
.atows.enter .logo{animation:atows-fade 1s ease both;animation-delay:.35s}
.atows.enter .ghost-hero{animation:atows-float-in 1.1s var(--ease) both;animation-delay:.5s}
@keyframes atows-rule{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes atows-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes atows-fade{from{opacity:0}to{opacity:1}}
@keyframes atows-float-in{from{opacity:0;transform:translateY(60px) rotate(-8deg)}to{opacity:1;transform:none}}
@keyframes atows-hop{0%{transform:none}40%{transform:translateY(-16px) rotate(-6deg)}100%{transform:none}}
@keyframes atows-pop{0%{transform:scale(1)}45%{transform:scale(1.12)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.atows *,.atows *::before{animation:none!important;transition:none!important}}
@media (max-width:900px){.atows .hero .wrap{grid-template-columns:1fr}.atows .logo{max-width:300px;padding:24px}.atows .grid3{grid-template-columns:1fr}
  .atows .step{grid-template-columns:64px minmax(0,1fr)}.atows .step .num{width:64px;height:64px;font-size:26px}.atows .step .acts{grid-column:1/-1}.atows .wrap{padding:0 22px}}
`;
function AtoWorkshop() {
  const theme = useTheme();
  const notify = useNotify();
  const { openChat } = useChatLauncher();
  const [setup, setSetup] = useState(() => store.get("setup", { c1: true }));
  const [done, setDone] = useState(() => store.get("done", {}));
  const [clone, setClone] = useState(() => store.get("clone", "~/ato-2026-dup-triage"));
  const [pulse, setPulse] = useState("");
  const [hop, setHop] = useState(0);
  const [enter, setEnter] = useState(true);
  const live = useRef(null);
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
    const t = setTimeout(() => setEnter(false), 1800);
    return () => clearTimeout(t);
  }, []);
  const total = SETUP.length + STEPS.length;
  const count = SETUP.filter((c) => setup[c.id]).length + STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round(count / total * 100);
  const nextStep = useMemo(() => STEPS.find((s) => !done[s.id]), [done]);
  const toggleDone = (s) => {
    const v = !done[s.id];
    setDone({ ...done, [s.id]: v });
    if (v) {
      setPulse(s.id);
      setHop((h) => h + 1);
      setTimeout(() => setPulse(""), 700);
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
  return /* @__PURE__ */ jsxs("div", { className: `atows${enter ? " enter" : ""}`, "data-mode": isLight(theme.mode) ? "light" : "dark", children: [
    /* @__PURE__ */ jsx("style", { children: CSS }),
    /* @__PURE__ */ jsxs("header", { className: "hero", children: [
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
          /* @__PURE__ */ jsxs("h1", { className: "rise", style: { ["--d"]: ".2s" }, children: [
            "Build your first",
            /* @__PURE__ */ jsx("br", {}),
            "Kiro Crew app"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "tag rise", style: { ["--d"]: ".3s" }, children: "An agent that triages your backlog while you sleep" }),
          /* @__PURE__ */ jsxs("ul", { className: "facts rise", style: { ["--d"]: ".4s" }, "aria-label": "Session facts", children: [
            /* @__PURE__ */ jsx("li", { children: "Mon, Oct 19, 2026" }),
            /* @__PURE__ */ jsx("li", { children: "2:30\u20134:30 PM ET" }),
            /* @__PURE__ */ jsx("li", { children: "Room 304" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "people rise", style: { ["--d"]: ".5s" }, children: [
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
      /* @__PURE__ */ jsxs("div", { className: "track", role: "group", "aria-label": "Workshop progress", children: [
        /* @__PURE__ */ jsxs("div", { className: "lbl", children: [
          /* @__PURE__ */ jsx("span", { children: nextStep ? `Next: Step ${nextStep.n} \u2014 ${nextStep.title}` : "All steps done. Share your fork!" }),
          /* @__PURE__ */ jsxs("span", { children: [
            count,
            " of ",
            total,
            " done"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bar", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": total, "aria-valuenow": count, "aria-label": `${count} of ${total} done`, children: [
          /* @__PURE__ */ jsx("div", { className: "fill", style: { width: `${pct}%` } }),
          /* @__PURE__ */ jsx("div", { className: `marker${hop ? " hop" : ""}`, style: { left: `${pct}%` }, "aria-hidden": "true", children: /* @__PURE__ */ jsx("img", { src: asset("ghosts/pose-5.svg"), alt: "" }) }, hop)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { ref: live, className: "sr", "aria-live": "polite", children: [
        count,
        " of ",
        total,
        " done"
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "s", "aria-labelledby": "setup-h", children: [
        /* @__PURE__ */ jsx("h2", { id: "setup-h", children: "Before you start" }),
        /* @__PURE__ */ jsx("p", { className: "lead", children: "Three things. Tick each one when it is true." }),
        /* @__PURE__ */ jsx("div", { className: "grid3", children: SETUP.map((c) => /* @__PURE__ */ jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxs("label", { className: "check", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: !!setup[c.id], onChange: () => setSetup({ ...setup, [c.id]: !setup[c.id] }) }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("b", { children: c.title }),
              /* @__PURE__ */ jsx("span", { children: c.hint })
            ] })
          ] }),
          c.id === "c3" && /* @__PURE__ */ jsxs("div", { className: "field", children: [
            /* @__PURE__ */ jsxs("a", { href: `https://github.com/${BASE_REPO}/fork`, target: "_blank", rel: "noreferrer", children: [
              "Fork ",
              BASE_REPO,
              " on GitHub \u2197"
            ] }),
            /* @__PURE__ */ jsx("label", { htmlFor: "atows-clone", children: "Your clone folder" }),
            /* @__PURE__ */ jsx("input", { id: "atows-clone", value: clone, spellCheck: false, onChange: (e) => setClone(e.target.value) }),
            /* @__PURE__ */ jsx("small", { children: "The guide works only in this folder." })
          ] })
        ] }, c.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "s", "aria-labelledby": "what-h", children: [
        /* @__PURE__ */ jsx("h2", { id: "what-h", children: "What is an app?" }),
        /* @__PURE__ */ jsx("p", { className: "lead", children: "You already have skills and MCP. An app packs them into one job you can install, trust and share." }),
        /* @__PURE__ */ jsx("div", { className: "grid3", children: CONCEPTS.map((c) => /* @__PURE__ */ jsxs("div", { className: `card concept${c.k === "App" ? " app" : ""}`, children: [
          /* @__PURE__ */ jsx("p", { className: "k", children: c.k }),
          /* @__PURE__ */ jsx("p", { className: "t", children: c.tag }),
          /* @__PURE__ */ jsx("p", { children: c.body }),
          /* @__PURE__ */ jsx("code", { children: c.eg })
        ] }, c.k)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "s", "aria-labelledby": "build-h", children: [
        /* @__PURE__ */ jsx("h2", { id: "build-h", children: "Build your app" }),
        /* @__PURE__ */ jsx("p", { className: "lead", children: "Each button opens a new chat with your guide and sends that step. The guide explains, then asks yes / no before it changes anything." }),
        /* @__PURE__ */ jsx("ol", { className: "steps", children: STEPS.map((s) => /* @__PURE__ */ jsxs("li", { className: `card step${done[s.id] ? " done" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: `num${pulse === s.id ? " pulse" : ""}`, "aria-hidden": "true", children: [
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
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: !!done[s.id], onChange: () => toggleDone(s) }),
              "Done",
              /* @__PURE__ */ jsxs("span", { className: "sr", children: [
                " with step ",
                s.n
              ] })
            ] })
          ] })
        ] }, s.id)) })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "s", "aria-labelledby": "safe-h", children: /* @__PURE__ */ jsxs("div", { className: "card boundary", children: [
        /* @__PURE__ */ jsx("img", { src: asset("ghosts/pose-8.svg"), alt: "", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { id: "safe-h", style: { fontSize: 26 }, children: "What the guide will and won\u2019t do" }),
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsx("li", { children: "It types for you: copies files, writes your skill, runs the install." }),
            /* @__PURE__ */ jsxs("li", { children: [
              "It asks ",
              /* @__PURE__ */ jsx("b", { children: "yes / no" }),
              " before every change."
            ] }),
            /* @__PURE__ */ jsx("li", { children: "It never writes to GitHub. You push to your own fork." }),
            /* @__PURE__ */ jsx("li", { children: "You trust and enable each app yourself, in Apps \u2192 Library." })
          ] })
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
