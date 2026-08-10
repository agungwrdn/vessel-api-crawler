const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizePosition } = require('./vessel-api-tracking')

test('normalizes VesselAPI position response for the GPS schema', () => {
  const position = normalizePosition({
    vesselPosition: {
      mmsi: 525901342,
      vessel_name: 'TEST VESSEL',
      latitude: -6.2,
      longitude: 106.8,
      sog: 8.5,
      timestamp: '2026-08-10T00:00:00Z',
    },
  })

  assert.deepEqual(position, {
    mmsi: '525901342',
    name: 'TEST VESSEL',
    latitude: -6.2,
    longitude: 106.8,
    speed: 8.5,
    timestamp: '2026-08-10T00:00:00Z',
  })
})
