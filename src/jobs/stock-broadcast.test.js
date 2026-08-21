const test = require('node:test')
const assert = require('node:assert/strict')

const { broadcastStokReport } = require('../../index')

test('emits monitoring phases for stock report and broadcasts', async () => {
  const phases = []
  const monitor = {
    phase: async (name, callback) => {
      phases.push(`${name}:running`)
      const result = await callback()
      phases.push(`${name}:success`)
      return result
    },
  }
  const http = {
    get: async () => ({ data: [{ region: 'NASIONAL', totalKios: 10, KiosLapor: 8, KiosBelumLapor: 2, kiosStokAda: 5, kiosStokKosong: 3 }] }),
    post: async () => ({ data: { ok: true } }),
  }

  await broadcastStokReport({ http, contacts: [{ phone: '+62000', name: 'TEST' }], monitor })

  assert.deepEqual(phases, [
    'fetch-stock-report:running',
    'fetch-stock-report:success',
    'broadcast-stock:+62000:running',
    'broadcast-stock:+62000:success',
  ])
})
