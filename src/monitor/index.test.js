const test = require('node:test')
const assert = require('node:assert/strict')

const { createMonitor } = require('./index')

function fakeStore() {
  const events = []
  return {
    events,
    startRun: async (jobName) => { events.push(['startRun', jobName]); return { runId: 1 } },
    startPhase: async (runId, phaseName) => { events.push(['startPhase', runId, phaseName]); return { phaseId: 2 } },
    finishPhase: async (...args) => events.push(['finishPhase', ...args]),
    finishRun: async (...args) => events.push(['finishRun', ...args]),
  }
}

test('records successful run and phase events', async () => {
  const store = fakeStore()
  const monitor = createMonitor('tracking', store)
  const result = await monitor.run(async (context) => monitor.phase(context, 'fetch-position', async () => 'ok'))

  assert.equal(result, 'ok')
  assert.deepEqual(store.events.map(([name]) => name), [
    'startRun', 'startPhase', 'finishPhase', 'finishRun',
  ])
  assert.equal(store.events[2][1], 2)
  assert.equal(store.events[2][2], 'success')
  assert.equal(store.events[3][2], 'success')
})

test('records errors while rethrowing the original job error', async () => {
  const store = fakeStore()
  const monitor = createMonitor('tracking', store)
  const expected = new Error('API failed')

  await assert.rejects(
    monitor.run(async (context) => monitor.phase(context, 'fetch-position', async () => { throw expected })),
    (error) => error === expected,
  )

  assert.equal(store.events[2][2], 'error')
  assert.equal(store.events[2][3].errorMessage, 'API failed')
  assert.equal(store.events[3][2], 'error')
  assert.equal(store.events[3][3].errorMessage, 'API failed')
})

test('does not propagate monitor storage errors into the job', async () => {
  const brokenStore = {
    startRun: async () => { throw new Error('sqlite down') },
    startPhase: async () => { throw new Error('sqlite down') },
    finishPhase: async () => { throw new Error('sqlite down') },
    finishRun: async () => { throw new Error('sqlite down') },
  }
  const monitor = createMonitor('tracking', brokenStore)

  assert.equal(await monitor.run(async (context) => monitor.phase(context, 'work', async () => 42)), 42)
})
