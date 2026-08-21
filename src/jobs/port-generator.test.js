const test = require('node:test')
const assert = require('node:assert/strict')

const { main } = require('../../generatorPort')

test('emits monitoring phases for port generator sources and Redis writes', async () => {
  const phases = []
  const monitor = {
    phase: async (name, callback) => {
      phases.push(`${name}:running`)
      const result = await callback()
      phases.push(`${name}:success`)
      return result
    },
  }
  const redis = { DEL: async () => {}, set: async () => {} }
  const sources = {
    PIM: async () => {},
    PKG: async () => {},
    PKGDischarging: async () => {},
    PKT: async () => {},
    PSP: async () => {},
  }

  await main({ monitor, redis, sources })

  assert.deepEqual(phases.filter((phase) => phase.endsWith(':success')).map((phase) => phase.split(':')[0]), [
    'redis-connect',
    'redis-clear',
    'fetch-port-pim',
    'fetch-port-pkg-loading',
    'fetch-port-pkg-discharging',
    'fetch-port-pkt',
    'fetch-port-psp',
    'redis-write',
  ])
})
