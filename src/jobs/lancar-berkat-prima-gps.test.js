const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizePosition, fetchPosition, savePosition, runOnce, parseEsns } = require('./lancar-berkat-prima-gps')

const payload = {
  status: '200',
  data: [{ esnid: '4585161', vessel_name: 'KM. LANCAR BERKAT PRIMA', longitude: 106.8, latitude: -6.2, speed: 8.5, datereported: '2026-08-12T00:00:00+07:00', direct: 180 }],
}

test('normalizes partner last-position response', () => {
  assert.deepEqual(normalizePosition(payload), {
    esn: '4585161', name: 'KM. LANCAR BERKAT PRIMA', latitude: -6.2, longitude: 106.8,
    speed: 8.5, heading: 180, timestamp: '2026-08-12T00:00:00+07:00',
  })
})

test('rejects responses without valid coordinates', () => {
  assert.throws(() => normalizePosition({ data: [{ esnid: '4585161', latitude: null, longitude: 1 }] }), /posisi yang valid/)
})

test('fetches with X-API-Key and partner endpoint', async () => {
  let request
  const position = await fetchPosition({ apiKey: 'test-key', http: { get: async (...args) => { request = args; return { data: payload } } } })
  assert.equal(position.esn, '4585161')
  assert.equal(request[0], 'https://shipmanagement-iksn.com/api/partner/v1/gps/getlastposition')
  assert.equal(request[1].params, undefined)
  assert.deepEqual(request[1].headers, { 'X-API-Key': 'test-key' })
  assert.equal(request[1].timeout, 30000)
})

test('saves partner position to current and history GPS tables', async () => {
  const calls = []
  const client = { device_gps: { upsert: async (args) => calls.push(['upsert', args]) }, device_gpsHits: { create: async (args) => { calls.push(['create', args]); return { ID: 1 } } } }
  const position = normalizePosition(payload)
  assert.deepEqual(await savePosition(position, client), { ID: 1 })
  assert.equal(calls[0][1].where.id, '4585161')
  assert.equal(calls[0][1].update.keterangan, 'Lancar Berkat Prima GPS API')
  assert.equal(calls[1][1].data.ObjectID, '4585161')
  assert.equal(calls[1][1].data.GPSTime.toISOString(), '2026-08-11T17:00:00.000Z')
})

test('runOnce fetches and persists the partner position', async () => {
  const saved = []
  const client = { device_gps: { upsert: async () => {} }, device_gpsHits: { create: async ({ data }) => { saved.push(data.ObjectID); return data } } }
  const positions = await runOnce({ apiKey: 'test-key', http: { get: async () => ({ data: payload }) }, client })
  assert.deepEqual(positions.map(({ esn }) => esn), ['4585161'])
  assert.deepEqual(saved, ['4585161'])
})

test('emits monitoring phases for partner GPS tracking', async () => {
  const phases = []
  const monitor = {
    phase: async (name, callback) => {
      phases.push(`${name}:running`)
      const result = await callback()
      phases.push(`${name}:success`)
      return result
    },
  }
  const client = { device_gps: { upsert: async () => {} }, device_gpsHits: { create: async ({ data }) => data } }

  await runOnce({
    apiKey: 'test-key',
    http: { get: async () => ({ data: payload }) },
    client,
    monitor,
  })

  assert.deepEqual(phases, [
    'fetch-partner-position:running',
    'fetch-partner-position:success',
    'save-position:running',
    'save-position:success',
  ])
})
