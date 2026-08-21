const test = require('node:test')
const assert = require('node:assert/strict')

const { resolveJob } = require('./app')

test('all selected jobs are callable entrypoints', () => {
  const selectedJobs = resolveJob('all')

  assert.ok(selectedJobs.length > 0)
  selectedJobs.forEach((job) => assert.equal(typeof job, 'function'))
})

test('monitor is available as a standalone entrypoint', () => {
  const selectedJobs = resolveJob('monitor')

  assert.equal(selectedJobs.length, 1)
  assert.equal(typeof selectedJobs[0], 'function')
})
