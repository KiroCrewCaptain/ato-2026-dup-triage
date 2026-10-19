// Backlog Factory: the board page.
//
// Four views, from the workshop mock-ups: Board (lanes + counts), Bugs (repro and
// fixer <-> reviewer rounds), Features (good problem? -> five whys -> first
// principles -> verdict) and Needs you (only what a person must decide).
//
// Data: the factory agent writes <repo>/factory/board.json; this app's own
// backend route (backend/routes.py) serves it at /api/apps/backlog-factory/board.
// Buttons that decide write factory/decisions.json through POST /decide. Buttons
// that need work (Run now, Send back) open a NEW chat on the backlog-factory agent,
// where every approval stays visible. Nothing here writes to GitHub, runs git, or
// merges: "Copy merge command" puts the command on your clipboard; you run it.
import { useAppApi, useChatLauncher, useNotify, useTheme } from '@kirocrew/app-sdk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const APP = 'backlog-factory'
const AGENT = 'backlog-factory'
const API = `/api/apps/${APP}`
const asset = (f: string) => new URL(`./assets/${f}`, import.meta.url).href

type Frame = { good?: string; whys?: string[]; root?: string; best?: string }
type Round = { n: number; stat?: string; verdict?: string; note?: string }
type Card = {
  n: number; title: string; kind?: string; size?: string; lane?: string; verdict?: string
  status?: string; reason?: string; dup_of?: number; asked?: number[]; needs?: string; lean?: string
  reply?: string; frame?: Frame; details?: string
  repro?: { cmd?: string; out?: string; note?: string; test?: string; result?: string; where?: string }
  fix?: { branch?: string; rounds?: Round[]; tests?: string; diff_file?: string; merge_cmd?: string }
}
type Board = {
  empty?: boolean; repo?: string; repo_dir?: string; source?: string; updated?: string
  run?: { state?: string; step?: string }; github_writes?: number; issues?: Card[]
  decisions?: Record<string, { choice: string; at: string }>
}

const LANES: { id: string; label: string; tone?: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'triage', label: 'Triage' },
  { id: 'reproduce', label: 'Reproduce' },
  { id: 'fix', label: 'Fix ⇄ Review' },
  { id: 'ready', label: 'Ready to merge', tone: 'green' },
  { id: 'needs_you', label: 'Needs you', tone: 'gold' },
]
const KNOWN = new Set(['inbox', 'triage', 'reproduce', 'fix', 'ready', 'needs_you', 'rejected', 'duplicate'])
const ALIAS: Record<string, string> = {
  'factory-triage': 'triage', 'factory-reproduce': 'reproduce', 'factory-fix-review': 'fix', docs: 'triage',
  build: 'triage', reframe: 'triage', review: 'fix', fixing: 'fix', 'in_review': 'fix', 'needs-you': 'needs_you',
  needs_info: 'needs_you', reject: 'rejected', dup: 'duplicate',
}
// Every card lands in a column: a lane the page does not know goes to Inbox (with a chip
// naming the lane it had), so a misspelled lane can never hide a card.
function laneOf(c: { lane?: string }): string {
  const raw = String(c.lane || 'inbox').trim().toLowerCase()
  if (KNOWN.has(raw)) return raw
  return ALIAS[raw] || 'inbox'
}
const TABS = ['Board', 'Bugs', 'Features', 'Needs you'] as const
type Tab = (typeof TABS)[number]

function isLight(sdkMode: string): boolean {
  const r = typeof document !== 'undefined' ? document.documentElement.dataset.mode : ''
  if (r === 'light' || r === 'dark') return r === 'light'
  return /light/.test(sdkMode || '')
}
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const issueUrl = (repo: string | undefined, n: number) => `https://github.com/${repo || 'KiroCrewCaptain/ato-2026-dup-triage'}/issues/${n}`

const CSS = `
@font-face{font-family:"BF Space Grotesk";font-weight:400 700;font-display:swap;src:url("${asset('fonts/SpaceGrotesk-latin.woff2')}") format("woff2")}
@font-face{font-family:"BF JetBrains Mono";font-weight:400 500;font-display:swap;src:url("${asset('fonts/JetBrainsMono-latin.woff2')}") format("woff2")}
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
`

function Chips({ c }: { c: Card }) {
  return (
    <div className="chips">
      {c.kind && <span className={`chip ${c.kind}`}>{c.kind}</span>}
      {c.size && <span className="chip">{c.size === 'product' ? 'product' : c.size}</span>}
      {c.status && <span className={`chip ${/green|reproduced/.test(c.status) ? 'g' : /round|fixing|review/.test(c.status) ? 'y' : ''}`}>{c.status}</span>}
      {c.dup_of && <span className="chip">dup of #{c.dup_of}</span>}
      {c.lane && !KNOWN.has(String(c.lane).trim().toLowerCase()) && <span className="chip y" title="This lane is not one the board knows">lane: {c.lane}</span>}
    </div>
  )
}

export default function BacklogFactory() {
  const api = useAppApi()
  const notify = useNotify()
  const theme = useTheme()
  const { openChat } = useChatLauncher()
  const [board, setBoard] = useState<Board | null>(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<Tab>('Board')
  const [repo, setRepo] = useState('')
  const [pick, setPick] = useState<number | null>(null)
  const [diff, setDiff] = useState<{ n: number; text: string } | null>(null)
  const [enter, setEnter] = useState(true)
  const mode = isLight((theme as any)?.mode) ? 'light' : 'dark'
  const timer = useRef<number | null>(null)
  const last = useRef('')

  const load = useCallback(async () => {
    try {
      const b = await api.get<Board>(`${API}/board`)
      const key = JSON.stringify(b)
      if (key !== last.current) { last.current = key; setBoard(b) }
      setErr('')
    } catch (e: any) { setErr(String(e?.message || e)) }
  }, [api])

  useEffect(() => {
    api.get<{ repo: string }>(`${API}/settings`).then((s) => setRepo(s.repo)).catch(() => {})
    load()
    const tick = () => { if (document.visibilityState === 'visible') load() }
    timer.current = window.setInterval(tick, 3000)
    const t = window.setTimeout(() => setEnter(false), 1400)
    return () => { if (timer.current) window.clearInterval(timer.current); window.clearTimeout(t) }
  }, [load, api])

  const issues = board?.issues || []
  const by = (lane: string) => issues.filter((c) => laneOf(c) === lane)
  const decisions = board?.decisions || {}
  const counts = useMemo(() => ({
    open: issues.length,
    bugs: issues.filter((c) => c.kind === 'bug').length,
    features: issues.filter((c) => c.kind === 'feature').length,
    questions: issues.filter((c) => c.kind === 'question' || c.kind === 'docs').length,
    needs: by('needs_you').length + by('ready').length,
    ready: by('ready').length,
  }), [board])

  const saveRepo = async () => {
    try {
      const s = await api.post<{ repo: string; repo_exists: boolean }>(`${API}/settings`, { repo })
      setRepo(s.repo)
      notify(s.repo_exists ? `Repo folder saved: ${s.repo}` : `Saved, but ${s.repo} does not exist yet.`, { type: s.repo_exists ? 'success' : 'info' })
      load()
    } catch (e: any) { notify(String(e?.message || e), { type: 'error' }) }
  }
  const runNow = () => openChat({
    agent: AGENT, autoSend: true,
    message: `Run the Backlog Factory on my repo folder: ${repo || '~/ato-2026-dup-triage'}. Use every Backlog Factory skill you have, in order. Ask me yes/no before your first write. Write nothing to GitHub.`,
  })
  const sendBack = (c: Card) => openChat({
    agent: AGENT, autoSend: true,
    message: `Send #${c.n} back to the fixer for one more round. Repo folder: ${repo}. My note: (type it here). Follow the fix-review skill; ask me yes/no first.`,
  })
  const decide = async (n: number, choice: string) => {
    try {
      await api.post(`${API}/decide`, { n, choice })
      notify(`#${n}: ${choice.replace(/_/g, ' ')} saved. The next run uses it.`, { type: 'success' })
      load()
    } catch (e: any) { notify(String(e?.message || e), { type: 'error' }) }
  }
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); notify(`${what} copied.`, { type: 'success' }) }
    catch { notify(text, { type: 'info' }) }
  }
  const openDiff = async (n: number) => {
    try {
      const r = await api.raw(`${API}/diff?n=${n}`)
      setDiff({ n, text: await r.text() })
    } catch (e: any) { notify(`No saved diff for #${n} yet.`, { type: 'info' }) }
  }
  const chosen = (n: number, choice: string) => decisions[String(n)]?.choice === choice

  const head = (crumb: string, title: string) => (
    <div className="top">
      <div>
        <div className="crumb">{crumb}</div>
        <h1>{title}</h1>
      </div>
      <div className="right">
        <div className="brand">
          <img className="kc" src={asset('kirocrew-icon.png')} alt="Kiro Crew" />
          <img className="ato" src={asset('ato-short-white.png')} alt="All Things Open 2026" />
        </div>
        <span className="pill">Timer 7:00 AM ET · Mon-Fri · paused</span>
        <button className="go" onClick={runNow}>Run now</button>
      </div>
    </div>
  )

  const statRow = (
    <div className="stats" role="list" aria-label="Counts">
      {[
        ['open issues', counts.open, ''], ['bugs', counts.bugs, 'red'], ['features', counts.features, 'kc'],
        ['questions + docs', counts.questions, ''], ['need you', counts.needs, 'gold'], ['ready to merge', counts.ready, 'green'],
      ].map(([l, v, cl], i) => (
        <div role="listitem" key={l as string} className={`stat ${cl}`} style={{ ['--i' as any]: i }}><b>{v as number}</b><span>{l as string}</span></div>
      ))}
    </div>
  )

  const BoardView = () => (
    <>
      <div className="lanes">
        {LANES.map((L) => {
          const cards = by(L.id)
          return (
            <section key={L.id} className={`lane ${L.tone || ''}`} aria-label={`${L.label}, ${cards.length} issues`}>
              <h3><span>{L.label}</span><span>{cards.length}</span></h3>
              {cards.map((c, i) => (
                <article key={c.n} className={`card rv ${laneOf(c) === 'fix' ? 'hot' : ''}`} style={{ ['--i' as any]: i }}>
                  <div className="num"><a href={issueUrl(board?.repo, c.n)} target="_blank" rel="noreferrer">#{c.n}</a></div>
                  <div className="t">{c.title}</div>
                  <Chips c={c} />
                  {c.reason && <div className="why">{c.reason}</div>}
                  {(c.kind === 'bug' && laneOf(c) !== 'inbox') && <button style={{ marginTop: 6, fontSize: 13, padding: '4px 10px' }} onClick={() => { setPick(c.n); setTab('Bugs') }}>Details</button>}
                </article>
              ))}
            </section>
          )
        })}
      </div>
      <div className="foot">
        <span>Rejected {by('rejected').length} · Duplicate {by('duplicate').length} · {by('rejected').concat(by('duplicate')).map((c) => `#${c.n}`).join(' ') || 'none yet'}</span>
        <span>{board?.run?.state === 'running' ? `Running: ${board?.run?.step}` : `Last run ${board?.updated || '—'}`} · {issues.length} read ({board?.source || 'live'})</span>
      </div>
    </>
  )

  const bugs = issues.filter((c) => c.kind === 'bug' && !['duplicate', 'inbox'].includes(laneOf(c)))
  const BugView = () => {
    const c = bugs.find((b) => b.n === pick) || bugs.find((b) => laneOf(b) === 'ready') || bugs.find((b) => laneOf(b) === 'fix') || bugs[0]
    if (!c) return <p className="why">No bugs sorted yet. Run the factory first.</p>
    const steps = [['Sorted: bug', true], ['Reproduced', !!c.repro?.result], ['Details added', !!c.details], [`Fix ⇄ Review${c.fix?.rounds?.length ? ` · round ${c.fix.rounds.length}` : ''}`, laneOf(c) === 'ready'], ['Ready to merge', laneOf(c) === 'ready'], ['You merge', false]] as const
    const nowIdx = steps.findIndex(([, d]) => !d)
    return (
      <div className="two">
        <nav className="list" aria-label="Bugs">
          {bugs.map((b) => <button key={b.n} aria-current={b.n === c.n} onClick={() => setPick(b.n)}>#{b.n} {b.title}<br /><span className="why">{b.status || b.lane}</span></button>)}
        </nav>
        <div>
          <div className="track" aria-label="Progress">{steps.map(([l, d], i) => <span key={l} className={d ? 'done' : i === nowIdx ? 'now' : ''}>{d ? '✓ ' : ''}{l}</span>)}</div>
          <div className="two" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}>
            <div className="panel">
              <div className="h">What the agents found</div>
              <p><b>Sorted as a bug</b> <span className="why">triage</span><br />{c.reason}{c.dup_of ? ` Same as #${c.dup_of}.` : ''}</p>
              {c.frame?.whys?.length ? <><div className="h">Five whys</div>{c.frame.whys.map((w, i) => <div key={i} className="why">why? {w}</div>)}</> : null}
              {c.repro ? <>
                <div className="h">Reproduced · {c.repro.where || 'your clone'}</div>
                <pre>{`$ ${c.repro.cmd}\n${c.repro.out || ''}`}{c.repro.note ? `\n← ${c.repro.note}` : ''}{c.repro.test ? `\nnew test: ${c.repro.test}  ${c.repro.result || ''}` : ''}</pre>
              </> : <p className="why">Not reproduced yet.</p>}
              {c.details && <><div className="h">Details added</div><p className="root">{c.details}</p></>}
            </div>
            <div className="panel">
              <div className="h">Fix ⇄ Review</div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="chip">Fixer · writes the fix</div><span aria-hidden="true">⇄</span><div className="chip">Reviewer · reads diff, runs tests</div>
              </div>
              <div className="rounds">
                {(c.fix?.rounds || []).map((r) => (
                  <div key={r.n}><span className="num">round {r.n}</span><span className="chip">{r.stat}</span>
                    <span className={r.verdict === 'green' ? 'ok' : 'no'}>{r.verdict === 'green' ? 'Green:' : 'Changes asked:'}</span><span className="why">{r.note}</span></div>
                ))}
                {c.fix?.branch && <div><span className="num">branch</span><span className="chip">{c.fix.branch}</span><span className="why">local · not pushed</span></div>}
                {!c.fix?.rounds?.length && <div><span className="why">No rounds yet.</span></div>}
              </div>
              {laneOf(c) === 'ready' && (
                <div className="ready">
                  <b className="ok">Ready for you</b>
                  <p className="why">Review is green. Read the diff, then merge it yourself.</p>
                  <div className="row">
                    <button className="go" onClick={() => openDiff(c.n)}>Open diff</button>
                    <button onClick={() => copy(c.fix?.merge_cmd || `git merge factory/fix-${c.n}`, 'Merge command')}>Copy merge command</button>
                    <button onClick={() => sendBack(c)}>Send back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const feats = issues.filter((c) => (c.kind === 'feature' || c.kind === 'docs') && c.frame && ['triage', 'needs_you', 'rejected', 'inbox'].includes(laneOf(c)))
  const VERDICT: Record<string, [string, string]> = {
    build: ['Build it', 'Goes to the fixer.'], reframe: ['Reframe it', 'Solve the root, not the ask.'],
    needs_you: ['Needs you', 'Product-level. Your call.'], reject: ['Reject', 'Not a good problem for jot.'],
  }
  const FeatureView = () => (
    <>
      <div className="track"><span className="now">1 · Good problem?</span><span className="now">2 · Five whys → root</span><span className="now">3 · First principles → best fix</span><span>Build · Reframe · Needs you · Reject</span></div>
      {!feats.length && <p className="why">No features sorted yet. Run the factory first.</p>}
      <div className="feats">
        {feats.map((c, i) => {
          const v = c.verdict && VERDICT[c.verdict] ? c.verdict : laneOf(c) === 'needs_you' ? 'needs_you' : laneOf(c) === 'rejected' ? 'reject' : 'build'
          return (
            <article key={c.n} className="feat rv" style={{ ['--i' as any]: i }}>
              <div className="num">#{c.n} · {c.kind}</div>
              <h3 style={{ margin: '2px 0 6px' }}>{c.title}</h3>
              <div className="chips">{c.size && <span className={`chip ${c.size === 'small' ? 'g' : 'y'}`}>{c.size === 'product' ? 'product-level' : c.size}</span>}{c.asked && c.asked.length > 1 && <span className="chip">asked {c.asked.length}×: {c.asked.map((x) => `#${x}`).join(' ')}</span>}</div>
              <div className="step"><b>1 · Good problem?</b><div>{c.frame?.good}</div></div>
              <div className="step"><b>2 · Five whys</b>{(c.frame?.whys || []).map((w, j) => <div key={j} className="why">why? {w}</div>)}{c.frame?.root && <div className="root">Root: {c.frame.root}</div>}</div>
              <div className="step"><b>3 · First principles</b><div>{c.frame?.best}</div></div>
              <div className={`verdict ${v}`}>
                <h4>{VERDICT[v][0]}</h4>
                <div className="why">{c.lean || VERDICT[v][1]}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  {v === 'build' && <><button className="go" aria-pressed={chosen(c.n, 'build')} onClick={() => decide(c.n, 'build')}>OK</button><button aria-pressed={chosen(c.n, 'reject')} onClick={() => decide(c.n, 'reject')}>No</button></>}
                  {v === 'reframe' && <><button className="go" aria-pressed={chosen(c.n, 'reframe')} onClick={() => decide(c.n, 'reframe')}>OK</button><button aria-pressed={chosen(c.n, 'as_asked')} onClick={() => decide(c.n, 'as_asked')}>Build as asked</button></>}
                  {v === 'needs_you' && <><button className="go" aria-pressed={chosen(c.n, 'agree')} onClick={() => decide(c.n, 'agree')}>Agree with lean</button><button aria-pressed={chosen(c.n, 'build')} onClick={() => decide(c.n, 'build')}>Build all</button><button aria-pressed={chosen(c.n, 'reject')} onClick={() => decide(c.n, 'reject')}>Reject</button></>}
                  {v === 'reject' && <button aria-pressed={chosen(c.n, 'build')} onClick={() => decide(c.n, 'build')}>Build anyway</button>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )

  const NEEDS: Record<string, [string, string]> = {
    merge: ['MERGE', 'var(--green-t)'], product: ['PRODUCT CALL', 'var(--gold-t)'], cant_reproduce: ["CAN'T REPRODUCE", 'var(--red-t)'],
    needs_info: ['NEEDS INFO', 'var(--red-t)'], stuck: ['STUCK', 'var(--red-t)'],
  }
  const needRows = [...by('ready').map((c) => ({ ...c, needs: 'merge' })), ...by('needs_you')]
  const NeedsView = () => (
    <div className="needs">
      {!needRows.length && <p className="why">Nothing needs you yet.</p>}
      {needRows.map((c) => {
        const [k, col] = NEEDS[c.needs || 'product'] || NEEDS.product
        return (
          <div key={c.n} className="rv">
            <span className="k" style={{ color: col }}>{k}</span>
            <div><b>#{c.n} {c.title}</b><div className="why">{c.needs === 'merge' ? `Review green · tests ${c.fix?.tests || '?'} · branch ${c.fix?.branch || ''}` : (c.lean || c.reason)}</div></div>
            <div className="row">
              {c.needs === 'merge' && <><button className="go" onClick={() => openDiff(c.n)}>Open diff</button><button onClick={() => copy(c.fix?.merge_cmd || `git merge factory/fix-${c.n}`, 'Merge command')}>Copy merge command</button></>}
              {c.needs === 'product' && <><button className="go" aria-pressed={chosen(c.n, 'agree')} onClick={() => decide(c.n, 'agree')}>Agree</button><button aria-pressed={chosen(c.n, 'build')} onClick={() => decide(c.n, 'build')}>Build</button><button aria-pressed={chosen(c.n, 'reject')} onClick={() => decide(c.n, 'reject')}>Reject</button></>}
              {(c.needs === 'cant_reproduce' || c.needs === 'needs_info') && <><button className="go" onClick={() => copy(c.reply || c.reason || '', 'Reply')}>Copy reply</button><button aria-pressed={chosen(c.n, 'park')} onClick={() => decide(c.n, 'park')}>Park it</button></>}
              {c.needs === 'stuck' && <button onClick={() => sendBack(c)}>Send back</button>}
            </div>
          </div>
        )
      })}
      <div className="foot"><span>Everything else runs on its own. You only see these.</span><span>All fixes on local branches</span></div>
    </div>
  )

  const titles: Record<Tab, [string, string]> = {
    Board: [`${board?.repo || 'ato-2026-dup-triage'} · read only`, 'Backlog Factory'],
    Bugs: ['Backlog Factory > Bugs', 'Prove it, fix it, review it'],
    Features: ['Backlog Factory > Features', 'Is it a good problem? Then the best fix.'],
    'Needs you': ['Backlog Factory > Needs you', `${needRows.length} things only you can decide`],
  }

  return (
    <div className={`bf ${enter && !reduced() ? 'enter' : ''}`} data-mode={mode}>
      <style>{CSS}</style>
      <div className="wrap">
        <div className="rule" aria-hidden="true" />
        {head(titles[tab][0], titles[tab][1])}
        <div className="row" style={{ margin: '0 0 12px' }}>
          <label htmlFor="bf-repo"><b>Repo folder</b></label>
          <input id="bf-repo" className="repo" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="~/ato-2026-dup-triage" />
          <button onClick={saveRepo}>Save</button>
          {err && <span className="no" role="alert">Board not readable: {err}</span>}
        </div>
        {board?.empty ? (
          <div className="empty">
            <h2>No board yet</h2>
            <p>The factory writes <code>factory/board.json</code> in your repo folder ({board.repo}{board.repo_exists ? '' : ', not found: fix the folder above'}).</p>
            <p>Press <b>Run now</b>. A chat opens with the backlog-factory agent. It asks yes/no before it writes, and it never writes to GitHub.</p>
          </div>
        ) : (
          <>
            {statRow}
            <div className="tabs" role="tablist">
              {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}{t === 'Needs you' && needRows.length ? ` (${needRows.length})` : ''}</button>)}
            </div>
            <div role="tabpanel">
              {tab === 'Board' && BoardView()}
              {tab === 'Bugs' && BugView()}
              {tab === 'Features' && FeatureView()}
              {tab === 'Needs you' && NeedsView()}
            </div>
          </>
        )}
      </div>
      {diff && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={`Diff for #${diff.n}`} onClick={() => setDiff(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between' }}><b>factory/fix-{diff.n} · local, not pushed</b><button autoFocus onClick={() => setDiff(null)}>Close</button></div>
            <pre>{diff.text}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
