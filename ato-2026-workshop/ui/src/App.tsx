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
import { useEffect, useMemo, useRef, useState } from 'react'

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
    does: 'The guide looks at your clone, your fork and the kirocrew command. It only reads.',
    see: 'A short checklist that ends with “All set, press Step 2”.' },
  { id: 's2', n: 2, lab: 'Lab 1', title: 'Build your app', ghost: 'pose-3.svg',
    does: 'The guide copies Lab 1 into dup-triage/ and installs your app, after your yes.',
    see: 'Dup Detective in Library. You trust and enable it there.' },
  { id: 's3', n: 3, lab: 'Lab 1', title: 'First run and check', ghost: 'pose-5.svg',
    does: 'You chat with your app’s agent, dup-triage. The guide scores its report against the answer key.',
    see: 'dup-triage-report.md with duplicate groups, each with a quote from both issues.' },
  { id: 's4', n: 4, lab: 'Lab 2', title: 'Memory and helpers', ghost: 'pose-7.svg',
    does: 'Your app gets memory: its agent keeps its verdicts and splits big lists across helper agents.',
    see: 'The second run says “N reused”. Each helper waits for your Allow.' },
  { id: 's5', n: 5, lab: 'Lab 3', title: 'Schedule, boundary and a page', ghost: 'pose-8.svg',
    does: 'Your app gets a paused weekday cron job, a post-only-on-your-fork rule, and its own page.',
    see: 'A Dup Detective page in the sidebar. The schedule shows Paused.' },
  { id: 's6', n: 6, title: 'Remix it into your idea', ghost: 'wave.svg',
    does: 'Tell the guide your idea. It writes a new skill into your app and reinstalls.',
    see: 'Your own skill inside your app. Try it in a chat with dup-triage.' },
  { id: 's7', n: 7, title: 'Share it', ghost: 'pose-1.svg',
    does: 'The guide commits your app on a branch. You push it to your fork yourself.',
    see: 'Your app in your fork. A friend clones it and installs the dup-triage/ folder.' },
]

const SETUP = [
  { id: 'c1', title: 'Kiro Crew installed', hint: 'You are reading this page, so yes.' },
  { id: 'c2', title: 'Signed in', hint: 'The Set up Kiro page is done and a chat answers.' },
  { id: 'c3', title: 'Your fork, cloned', hint: 'Fork the starter repo on GitHub, then clone your fork.' },
]

// "What is an app?" — the owner's model, same labels as the deck (slides 3-4).
// The real Lab 3 part sits under each label.
const PLUGIN = [
  { k: 'Skill', code: 'skills/', real: 'skills/dup-triage' },
  { k: 'MCP', code: 'mcpServers', real: 'optional: none of its own' },
]
const APP_PARTS = [
  { k: 'Cron jobs', code: 'crons', real: 'dup-triage-daily, paused' },
  { k: 'Memory', code: 'verdicts file', real: 'dup-triage-verdicts.json' },
  { k: 'Harness API', code: '@kirocrew-core', real: 'spawn_run · /api/crons' },
  { k: 'UI bundle', code: 'ui/dist', real: 'its own page' },
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

const CSS = `
@font-face{font-family:"ATO Space Grotesk";font-weight:400 700;font-display:swap;src:url("${asset('fonts/SpaceGrotesk-latin.woff2')}") format("woff2")}
@font-face{font-family:"ATO JetBrains Mono";font-weight:400 500;font-display:swap;src:url("${asset('fonts/JetBrainsMono-latin.woff2')}") format("woff2")}
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
.atows .build{display:grid;gap:22px}
.atows .eq{display:flex;align-items:stretch;flex-wrap:wrap;gap:12px 0}
.atows .frag{display:flex;align-items:stretch}
.atows .op{align-self:center;font:700 34px/1 var(--sans);color:var(--accent-text);padding:0 12px}
.atows .tile{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;justify-content:center;gap:8px;min-width:150px}
.atows .tile b{font-size:24px;line-height:1.1}
.atows .tile code{font-family:var(--mono);font-size:15px;color:var(--muted)}
.atows .tile span{font-size:16px;color:var(--muted)}
.atows .eq.r1 .tile{min-width:190px}.atows .eq.r1 .tile b{font-size:30px}
.atows .tile.plug{border:2px solid rgba(142,72,255,.75);background:rgba(142,72,255,.13)}
.atows .tile.app{border:3px solid var(--red);background:rgba(234,58,64,.13);min-width:150px}.atows .tile.app b{font-size:36px}
.atows .eq.r2{flex-wrap:nowrap}
.atows .eq.r2 .op{font-size:28px;padding:0 7px}
.atows .eq.r2 .tile{min-width:0;padding:12px 14px;gap:6px}
.atows .eq.r2 .tile b{font-size:20px;white-space:nowrap}
.atows .eq.r2 .tile code{font-size:13px;white-space:nowrap}
.atows .eq.r2 .tile.app b{font-size:30px}
.atows .osrow.frag{display:block}
.atows .osrow h3{margin:8px 0 12px;font-size:26px}
.atows .osmap{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0}
.atows .pair{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 18px}
.atows .pair dt{font-weight:700;color:var(--muted);min-width:96px}
.atows .pair dt::after{content:"↔";margin-left:12px;color:var(--accent-text)}
.atows .pair dd{margin:0;font-weight:700;font-size:20px}
.atows .real{margin-top:18px;color:var(--muted)}
.atows .real summary{cursor:pointer;font-weight:600;color:var(--ink)}
.atows .real ul{margin:10px 0 0;padding-left:22px;columns:2}
.atows .real li{margin:4px 0}.atows .real code{font-family:var(--mono);font-size:15px}
.atows .build .frag{opacity:0;transform:translateY(14px)}
.atows .build.on .frag{animation:atows-rise .55s var(--ease) both;animation-delay:calc(var(--i) * 140ms)}
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
.atows .howto{margin:8px 0 10px;padding-left:24px}.atows .howto li{margin:6px 0}.atows .howto code,.atows .see code{font-family:var(--mono);font-size:15px}
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
@media (prefers-reduced-motion:reduce){.atows *,.atows *::before{animation:none!important;transition:none!important}.atows .build .frag{opacity:1;transform:none}}
@media (max-width:900px){.atows .hero .wrap{grid-template-columns:1fr}.atows .logo{max-width:300px;padding:24px}.atows .grid3,.atows .osmap{grid-template-columns:1fr}.atows .eq.r2{flex-wrap:wrap}
  .atows .step{grid-template-columns:64px minmax(0,1fr)}.atows .step .num{width:64px;height:64px;font-size:26px}.atows .step .acts{grid-column:1/-1}.atows .wrap{padding:0 22px}}
`

export default function AtoWorkshop() {
  const theme = useTheme()
  const notify = useNotify()
  const { openChat } = useChatLauncher()
  const [setup, setSetup] = useState<Record<string, boolean>>(() => store.get('setup', { c1: true }))
  const [done, setDone] = useState<Record<string, boolean>>(() => store.get('done', {}))
  const [clone, setClone] = useState<string>(() => store.get('clone', '~/ato-2026-dup-triage'))
  const [pulse, setPulse] = useState<string>('')
  const [hop, setHop] = useState(0)
  const [enter, setEnter] = useState(true)
  const live = useRef<HTMLDivElement>(null)
  const whatRef = useRef<HTMLElement>(null)
  const [built, setBuilt] = useState(false)
  // The plugin -> app build-up plays once, the first time the section is on
  // screen, then rests on the full equation. Reduced motion: CSS shows it at once.
  useEffect(() => {
    const el = whatRef.current
    if (!el || typeof IntersectionObserver === 'undefined') { setBuilt(true); return }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setBuilt(true); io.disconnect() } }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => { store.set('setup', setup) }, [setup])
  useEffect(() => { store.set('done', done) }, [done])
  useEffect(() => { store.set('clone', clone) }, [clone])
  // The entrance plays once on load, then the page rests on its final frame.
  useEffect(() => { const t = setTimeout(() => setEnter(false), 1800); return () => clearTimeout(t) }, [])

  const total = SETUP.length + STEPS.length
  const count = SETUP.filter((c) => setup[c.id]).length + STEPS.filter((s) => done[s.id]).length
  const pct = Math.round((count / total) * 100)
  const nextStep = useMemo(() => STEPS.find((s) => !done[s.id]), [done])

  const toggleDone = (s: Step) => {
    const v = !done[s.id]
    setDone({ ...done, [s.id]: v })
    if (v) { setPulse(s.id); setHop((h) => h + 1); setTimeout(() => setPulse(''), 700) }
  }
  const openStep = (s: Step) => openChat({ agent: GUIDE_AGENT, message: promptFor(s, clone.trim() || '~/ato-2026-dup-triage'), autoSend: true })
  const copyStep = async (s: Step) => {
    const text = promptFor(s, clone.trim() || '~/ato-2026-dup-triage')
    try { await navigator.clipboard.writeText(text); notify('Prompt copied. Paste it into a workshop-guide chat.', { type: 'success' }) }
    catch { notify(text, { type: 'info' }) }
  }

  return (
    <div className={`atows${enter ? ' enter' : ''}`} data-mode={isLight(theme.mode) ? 'light' : 'dark'}>
      <style>{CSS}</style>
      <header className="hero">
        <div className="rule" aria-hidden="true" />
        <div className="wrap">
          <div>
            <div className="brandrow rise" style={{ ['--d' as string]: '.05s' }}>
              <img src={asset('kirocrew-icon.png')} alt="Kiro Crew" />
              <span className="wordmark">KIRO CREW <span className="x" aria-hidden="true">×</span><span className="sr">at</span> ALL THINGS OPEN 2026</span>
            </div>
            <div className="eyebrow rise" style={{ ['--d' as string]: '.12s' }}>Hands-on workshop · your guide</div>
            <h1 className="rise" style={{ ['--d' as string]: '.2s' }}>Build your first<br />Kiro Crew app</h1>
            <p className="tag rise" style={{ ['--d' as string]: '.3s' }}>An agentic app that triages your backlog while you sleep</p>
            <ul className="facts rise" style={{ ['--d' as string]: '.4s' }} aria-label="Session facts">
              <li>Mon, Oct 19, 2026</li>
              <li>2:30–4:30 PM ET</li>
              <li>Room 304</li>
            </ul>
            <p className="people rise" style={{ ['--d' as string]: '.5s' }}>
              With <b>Arundeep Nagaraj</b>, <b>Bolin Chen</b> and <b>Zezhen Xu</b>
            </p>
          </div>
          <div className="logo"><img src={asset('ato-full-white.png')} alt="All Things Open 2026" /></div>
        </div>
        <img className="ghost-hero" src={asset('ghosts/wave.svg')} alt="" aria-hidden="true" />
      </header>

      <div className="wrap">
        <div className="track" role="group" aria-label="Workshop progress">
          <div className="lbl">
            <span>{nextStep ? `Next: Step ${nextStep.n} — ${nextStep.title}` : 'All steps done. Share your fork!'}</span>
            <span>{count} of {total} done</span>
          </div>
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count} aria-label={`${count} of ${total} done`}>
            <div className="fill" style={{ width: `${pct}%` }} />
            <div key={hop} className={`marker${hop ? ' hop' : ''}`} style={{ left: `${pct}%` }} aria-hidden="true">
              <img src={asset('ghosts/pose-5.svg')} alt="" />
            </div>
          </div>
        </div>
        <div ref={live} className="sr" aria-live="polite">{count} of {total} done</div>

        <section className="s" aria-labelledby="setup-h">
          <h2 id="setup-h">Before you start</h2>
          <p className="lead">Three things. Tick each one when it is true.</p>
          <div className="grid3">
            {SETUP.map((c) => (
              <div className="card" key={c.id}>
                <label className="check">
                  <input type="checkbox" checked={!!setup[c.id]} onChange={() => setSetup({ ...setup, [c.id]: !setup[c.id] })} />
                  <span><b>{c.title}</b><span>{c.hint}</span></span>
                </label>
                {c.id === 'c3' && (
                  <div className="field">
                    <a href={`https://github.com/${BASE_REPO}/fork`} target="_blank" rel="noreferrer">Fork {BASE_REPO} on GitHub ↗</a>
                    <label htmlFor="atows-clone">Your clone folder</label>
                    <input id="atows-clone" value={clone} spellCheck={false} onChange={(e) => setClone(e.target.value)} />
                    <small>The guide works only in this folder.</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="s" aria-labelledby="what-h" ref={whatRef}>
          <h2 id="what-h">What is a Kiro Crew app?</h2>
          <p className="lead">Skill and MCP make an agent plugin. Add the rest, and it is an app.</p>
          <div className={`build${built ? ' on' : ''}`}>
            <div className="eq r1" role="group" aria-label="Skill plus MCP equals Agent plugin">
              {PLUGIN.map((t, i) => (
                <div className="frag" key={t.k} style={{ ['--i' as string]: i }}>
                  {i > 0 && <span className="op" aria-hidden="true">+</span>}
                  <div className="tile"><b>{t.k}</b><code>{t.code}</code></div>
                </div>
              ))}
              <div className="frag" style={{ ['--i' as string]: 2 }}>
                <span className="op" aria-hidden="true">=</span>
                <div className="tile plug"><b>Agent plugin</b></div>
              </div>
            </div>
            <div className="eq r2" role="group" aria-label="Agent plugin plus cron jobs, memory, harness API and UI bundle equals App">
              <div className="frag" style={{ ['--i' as string]: 3 }}>
                <div className="tile plug"><b>Agent plugin</b></div>
              </div>
              {APP_PARTS.map((t, i) => (
                <div className="frag" key={t.k} style={{ ['--i' as string]: 4 + i }}>
                  <span className="op" aria-hidden="true">+</span>
                  <div className="tile"><b>{t.k}</b><code>{t.code}</code></div>
                </div>
              ))}
              <div className="frag" style={{ ['--i' as string]: 8 }}>
                <span className="op" aria-hidden="true">=</span>
                <div className="tile app"><b>App</b><span>your own UI</span></div>
              </div>
            </div>
            <div className="osrow frag" style={{ ['--i' as string]: 9 }}>
              <h3>Kiro Crew = an Agent OS</h3>
              <dl className="osmap">
                {OS_MAP.map(([l, r]) => (
                  <div className="pair" key={l}><dt>{l}</dt><dd>{r}</dd></div>
                ))}
              </dl>
            </div>
          </div>
          <details className="real">
            <summary>Where each part is in Dup Detective (Lab 3)</summary>
            <ul>
              {[...PLUGIN, ...APP_PARTS].map((t) => (
                <li key={t.k}><b>{t.k}</b> <code>{t.real}</code></li>
              ))}
            </ul>
          </details>
        </section>

        <section className="s" aria-labelledby="build-h">
          <h2 id="build-h">Build your app</h2>
          <p className="lead">Each button opens a new chat with this app’s agent, your guide, and sends that step. It explains, then asks yes / no before it changes anything.</p>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.id} className={`card step${done[s.id] ? ' done' : ''}`}>
                <div className={`num${pulse === s.id ? ' pulse' : ''}`} aria-hidden="true">
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
                    <input type="checkbox" checked={!!done[s.id]} onChange={() => toggleDone(s)} />
                    Done<span className="sr"> with step {s.n}</span>
                  </label>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="s" aria-labelledby="safe-h">
          <div className="card boundary">
            <img src={asset('ghosts/pose-8.svg')} alt="" aria-hidden="true" />
            <div>
              <h2 id="safe-h" style={{ fontSize: 26 }}>What your guide (this app’s agent) will and won’t do</h2>
              <ul>
                <li>It types for you: copies files, writes your skill, runs the install.</li>
                <li>It asks <b>yes / no</b> before every change.</li>
                <li>It never writes to GitHub. You push to your own fork.</li>
                <li>You trust and enable each app yourself, in Library.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="s" aria-labelledby="share-h">
          <div className="card">
            <h2 id="share-h" style={{ fontSize: 26 }}>Install this app on another laptop</h2>
            <p className="see">From GitHub, about 20 seconds. No GitHub sign-in; the laptop needs <code>git</code>.</p>
            <ol className="howto">
              <li><b>Discover</b> → database icon (<b>Manage app sources</b>) → <b>Add Registry</b></li>
              <li>Repo: <code>https://github.com/{BASE_REPO}</code> → <b>Add Registry</b></li>
              <li>Search <b>ATO 2026</b> → <b>Install</b> → <b>Trust this app and enable</b>, then press <b>Enable</b> on the app page</li>
            </ol>
            <p className="see">No <code>git</code>, or GitHub blocked? Clone or unzip the repo, use <b>Install from Path</b> in the same menu with its <code>ato-2026-workshop</code> folder, then trust and enable it in <b>Library</b>.</p>
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
