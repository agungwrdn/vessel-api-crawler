const test = require('node:test')
const assert = require('node:assert/strict')

const {
  normalizePosition,
  normalizeTelkomsatPosition,
  normalizeVesselInformation,
  fetchVesselInformation,
  syncMissingVesselInformation,
  fetchTelkomsatPositions,
  savePosition,
  parseMmsis,
  runOnce,
} = require('./vessel-api-tracking')

const telkomsatPayload = {
  code: 200,
  message: 'OK',
  data: [{
    mmsi: '525018003',
    name: 'KM SOEMANTRI BRODJONEGORO',
    lat: '-6.9078460',
    lon: '110.3856890',
    sog: '21.86',
    timestamp: 1787275392,
  }],
}

const vesselInformationPayload = {
  vessel: {
    mmsi: 525901923,
    name: 'KM TEST VESSEL',
    vessel_type: 'Cargo Ship',
  },
}

test('parses a comma-separated MMSI configuration', () => {
  assert.deepEqual(parseMmsis('525901923, 525006415,,525301532'), [
    '525901923',
    '525006415',
    '525301532',
  ])
})

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

test('normalizes VesselAPI vessel information response', () => {
  assert.deepEqual(normalizeVesselInformation(vesselInformationPayload, '525901923'), {
    mmsi: '525901923',
    name: 'KM TEST VESSEL',
  })
})

test('fetches vessel information by MMSI', async () => {
  let request
  const vessel = await fetchVesselInformation({
    mmsi: '525901923',
    apiKey: 'test-key',
    http: {
      get: async (...args) => {
        request = args
        return { data: vesselInformationPayload }
      },
    },
  })

  assert.equal(request[0], 'https://api.vesselapi.com/v1/vessel/525901923')
  assert.deepEqual(request[1].params, { 'filter.idType': 'mmsi' })
  assert.deepEqual(request[1].headers, { Authorization: 'Bearer test-key' })
  assert.equal(vessel.name, 'KM TEST VESSEL')
})

test('syncs information only for MMSIs missing from the database', async () => {
  const upserts = []
  const client = {
    device_gps: {
      findMany: async () => [{ id: '525901923' }],
      upsert: async (args) => upserts.push(args),
    },
  }
  const result = await syncMissingVesselInformation({
    mmsis: ['525901923', '525006415'],
    apiKey: 'test-key',
    http: {
      get: async () => ({ data: { vessel: { mmsi: '525006415', name: 'KM MISSING VESSEL' } } }),
    },
    client,
  })

  assert.deepEqual(result.missing, ['525006415'])
  assert.deepEqual(upserts, [{
    where: { id: '525006415' },
    update: { keterangan: 'KM MISSING VESSEL' },
    create: { id: '525006415', keterangan: 'KM MISSING VESSEL' },
  }])
})

test('normalizes Telkomsat my_vessel response for the GPS schema', () => {
  assert.deepEqual(normalizeTelkomsatPosition(telkomsatPayload.data[0]), {
    mmsi: '525018003',
    name: 'KM SOEMANTRI BRODJONEGORO',
    latitude: -6.907846,
    longitude: 110.385689,
    speed: 21.86,
    timestamp: '2026-08-21T01:23:12.000Z',
  })
})

test('posts the Telkomsat key as multipart form data', async () => {
  let request
  const positions = await fetchTelkomsatPositions({
    apiKey: 'test-key',
    http: {
      post: async (...args) => {
        request = args
        return { data: telkomsatPayload }
      },
    },
  })

  assert.equal(request[0], 'https://vis.telkomsat.co.id/api/my_vessel')
  assert.match(request[1].getBuffer().toString(), /name="key"\r?\n\r?\ntest-key/)
  assert.match(request[2].headers['content-type'], /multipart\/form-data/)
  assert.equal(request[2].timeout, 30000)
  assert.deepEqual(positions.map(({ mmsi }) => mmsi), ['525018003'])
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
      update: { nama_kapal: 'TEST VESSEL' },
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

test('fetches and saves every configured vessel', async () => {
  const saved = []
  const http = {
    get: async (url) => ({
      data: {
        vesselPosition: {
          mmsi: url.includes('525901923') ? '525901923' : '525006415',
          vessel_name: 'TEST VESSEL',
          latitude: -6.2,
          longitude: 106.8,
          timestamp: '2026-08-10T00:00:00Z',
        },
      },
    }),
  }
  const client = {
    device_gps: { upsert: async () => {} },
    device_gpsHits: {
      create: async ({ data }) => {
        saved.push(data.ObjectID)
        return data
      },
    },
  }

  const positions = await runOnce({
    mmsis: ['525901923', '525006415'],
    apiKey: 'test-key',
    http,
    client,
  })

  assert.deepEqual(positions.map((position) => position.mmsi), [
    '525901923',
    '525006415',
  ])
  assert.deepEqual(saved, ['525901923', '525006415'])
})

test('runOnce fetches and persists Telkomsat vessels', async () => {
  const saved = []
  const client = {
    device_gps: { findMany: async () => [], upsert: async () => {} },
    device_gpsHits: {
      create: async ({ data }) => {
        saved.push(data.ObjectID)
        return data
      },
    },
  }
  const positions = await runOnce({
    mmsis: [],
    telkomsatApiKey: 'test-key',
    http: {
      post: async () => ({ data: telkomsatPayload }),
    },
    client,
  })

  assert.deepEqual(positions.map(({ mmsi }) => mmsi), ['525018003'])
  assert.deepEqual(saved, ['525018003'])
})
