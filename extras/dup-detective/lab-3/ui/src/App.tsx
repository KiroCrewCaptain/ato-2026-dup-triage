import { useAppApi, useChatLauncher } from '@kirocrew/app-sdk'
import { Btn, Card, CardTitle, PageHeader, StatCard } from '@kirocrew/app-sdk/ui'
import { useEffect, useState } from 'react'

// The one prompt this page sends. It is shown to the user as a draft in a new
// chat (autoSend: false), so nothing runs until they press send.
const RUN_PROMPT =
  'Use the dup-triage skill on the open issues of KiroCrewCaptain/ato-2026-dup-triage ' +
  '(or data/issues.json if GitHub is unreachable). Write dup-triage-report.md. Post nothing.'

type Job = {
  id: string
  name: string
  enabled: boolean
  schedule: string
  next_run_ts?: number | null
  app?: string | null
}

export default function DupTriage() {
  const api = useAppApi()
  const { openChat } = useChatLauncher()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // /api/crons is declared in app.json; for an app it returns only its own jobs.
    api
      .get('/api/crons')
      .then((data: { jobs?: Job[] }) => {
        const mine = (data.jobs || []).find((j) => j.name.endsWith('dup-triage-daily'))
        setJob(mine || null)
      })
      .catch((e: unknown) => setError(String(e)))
  }, [])

  const scheduleState = error ? 'unknown' : !job ? 'not registered' : job.enabled ? 'on' : 'paused'

  return (
    <>
      <PageHeader title="Dup Detective" subtitle="Finds duplicate issues and explains every match. Drafts only." />
      <div className="px-6 pb-8 overflow-y-auto flex-1 min-h-0">
        <div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] mb-6">
          <StatCard label="Schedule" value={scheduleState} accent={scheduleState === 'on'} />
          <StatCard label="Writes to GitHub" value="none without your yes" />
        </div>

        <Card>
          <CardTitle>Run it now</CardTitle>
          <p className="text-sm text-muted mb-3">
            Opens a new chat with the dup-triage agent. Set Project to your clone, then paste this
            prompt if the box is empty and press send:
          </p>
          <pre className="text-xs mb-3 whitespace-pre-wrap select-all">{RUN_PROMPT}</pre>
          <Btn onClick={() => openChat({ agent: 'dup-triage', message: RUN_PROMPT, autoSend: false })}>Draft a run in chat</Btn>
        </Card>

        <Card>
          <CardTitle>Schedule</CardTitle>
          <p className="text-sm text-muted">
            {job
              ? `${job.schedule}. Ships paused: resume it on the Schedule page when you want it.`
              : error
                ? `Could not read the schedule: ${error}`
                : 'No dup-triage-daily job found. Is the app enabled?'}
          </p>
        </Card>

        <Card>
          <CardTitle>The boundary</CardTitle>
          <ul className="text-sm text-muted list-disc pl-5">
            <li>Reads issues from KiroCrewCaptain/ato-2026-dup-triage or data/issues.json.</li>
            <li>Writes only dup-triage-report.md and dup-triage-verdicts.json on your machine.</li>
            <li>Never posts on a schedule.</li>
            <li>Posts one comment, only on your own fork, only after you say yes in chat.</li>
          </ul>
        </Card>
      </div>
    </>
  )
}
