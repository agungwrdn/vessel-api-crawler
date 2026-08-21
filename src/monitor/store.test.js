const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const { createMonitorStore } = require('./store')

test('stores runs, phases, errors, and latest job status in SQLite', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel-monitor-'))
  const store = createMonitorStore({ filename: path.join(directory, 'monitor.sqlite') })

  const run = await store.startRun('vessel-api-tracking', { mmsis: 2 })
  const successPhase = await store.startPhase(run.runId, 'fetch-position', { mmsi: '525901923' })
  await store.finishPhase(successPhase.phaseId, 'success', { message: 'position fetched', details: { count: 1 } })
  const errorPhase = await store.startPhase(run.runId, 'save-position', { mmsi: '525901923' })
  await store.finishPhase(errorPhase.phaseId, 'error', { message: 'database unavailable', errorMessage: 'ECONNREFUSED' })
  await store.finishRun(run.runId, 'error', { message: 'partial failure', errorMessage: 'ECONNREFUSED' })

  const jobs = await store.listJobs()
  const runs = await store.listRuns(10)
  const health = await store.health()

  assert.equal(jobs[0].job_name, 'vessel-api-tracking')
  assert.equal(jobs[0].status, 'error')
  assert.equal(jobs[0].error_message, 'ECONNREFUSED')
  assert.equal(runs[0].phases.length, 2)
  assert.equal(runs[0].phases[1].status, 'error')
  assert.equal(runs[0].phases[1].error_message, 'ECONNREFUSED')
  assert.equal(health.ok, true)

  await store.close()
  fs.rmSync(directory, { recursive: true, force: true })
})
