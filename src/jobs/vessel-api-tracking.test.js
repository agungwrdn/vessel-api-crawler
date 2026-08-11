const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizePosition, savePosition } = require('./vessel-api-tracking')

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

test('saves the current vessel and GPS history using the GPS timestamp', async () => {
  const calls = []
  const client = {
    device_gps: {
      upsert: async (args) => calls.push(['upsert', args]),
    },
    device_gpsHits: {
      create: async (args) => {
        calls.push(['create', args])
        return { ID: 1 }
      },
    },
  }

  const position = {
    mmsi: '525901342',
    name: 'TEST VESSEL',
    latitude: -6.2,
    longitude: 106.8,
    speed: 8.5,
    timestamp: '2026-08-10T00:00:00Z',
  }

  const result = await savePosition(position, client)

  assert.deepEqual(result, { ID: 1 })
  assert.deepEqual(calls, [
    ['upsert', {
      where: { id: '525901342' },
      update: { keterangan: 'VesselAPI', nama_kapal: 'TEST VESSEL' },
      create: {
        id: '525901342',
        keterangan: 'VesselAPI',
        nama_kapal: 'TEST VESSEL',
      },
    }],
    ['create', {
      data: {
        ObjectID: '525901342',
        Lat: -6.2,
        Lon: 106.8,
        Speed: 8.5,
        GPSTime: new Date('2026-08-10T00:00:00Z'),
        LastDataTime: new Date('2026-08-10T00:00:00Z'),
      },
    }],
  ])
})
