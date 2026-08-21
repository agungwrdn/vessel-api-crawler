try {
  require('dotenv').config()
} catch {
  // Environment variables can also be provided directly by the process manager.
}

const axios = require('axios')
const FormData = require('form-data')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const API_URL = process.env.VESSELAPI_URL || 'https://api.vesselapi.com/v1'
const MMSI = process.env.VESSELAPI_MMSI || '525901342'
const TELKOMSAT_API_URL = process.env.TELKOMSAT_API_URL || 'https://vis.telkomsat.co.id/api/my_vessel'
const INTERVAL_MS = 6 * 60 * 60 * 1000

function parseMmsis(value = MMSI) {
  return String(value)
    .split(',')
    .map((mmsi) => mmsi.trim())
    .filter(Boolean)
}

function normalizePosition(payload) {
  const position = payload && (payload.vesselPosition || payload.position)
  if (!position || position.latitude == null || position.longitude == null) {
    throw new Error('VesselAPI response tidak berisi posisi yang valid')
  }

  return {
    mmsi: String(position.mmsi || MMSI),
    name: position.vessel_name || null,
    latitude: Number(position.latitude),
    longitude: Number(position.longitude),
    speed: position.sog == null ? null : Number(position.sog),
    timestamp: position.timestamp || position.processed_timestamp || new Date().toISOString(),
  }
}

async function fetchPosition({ mmsi = MMSI, apiKey = process.env.VESSELAPI_API_KEY, http = axios } = {}) {
  if (!apiKey) throw new Error('VESSELAPI_API_KEY belum diisi')

  const response = await http.get(`${API_URL}/vessel/${mmsi}/position`, {
    params: { 'filter.idType': 'mmsi' },
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 30_000,
  })

  return normalizePosition(response.data)
}

function normalizeVesselInformation(payload, fallbackMmsi) {
  const vessel = payload && payload.vessel
  if (!vessel || !vessel.name) {
    throw new Error('VesselAPI response tidak berisi informasi kapal yang valid')
  }

  return {
    mmsi: String(vessel.mmsi || fallbackMmsi),
    name: vessel.name,
  }
}

async function fetchVesselInformation({
  mmsi,
  apiKey = process.env.VESSELAPI_API_KEY,
  http = axios,
} = {}) {
  if (!mmsi) throw new Error('MMSI belum diisi')
  if (!apiKey) throw new Error('VESSELAPI_API_KEY belum diisi')

  const response = await http.get(`${API_URL}/vessel/${encodeURIComponent(mmsi)}`, {
    params: { 'filter.idType': 'mmsi' },
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 30_000,
  })

  return normalizeVesselInformation(response.data, mmsi)
}

async function syncMissingVesselInformation({
  mmsis = parseMmsis(),
  apiKey = process.env.VESSELAPI_API_KEY,
  http = axios,
  client = prisma,
} = {}) {
  const configuredMmsis = [...new Set(mmsis.map((mmsi) => String(mmsi).trim()).filter(Boolean))]
  if (!configuredMmsis.length) return { missing: [], synced: [] }

  const existing = await client.device_gps.findMany({
    where: { id: { in: configuredMmsis } },
    select: { id: true },
  })
  const existingIds = new Set(existing.map(({ id }) => String(id)))
  const missing = configuredMmsis.filter((mmsi) => !existingIds.has(mmsi))
  const synced = []

  for (const mmsi of missing) {
    try {
      const vessel = await fetchVesselInformation({ mmsi, apiKey, http })
      await client.device_gps.upsert({
        where: { id: mmsi },
        update: { keterangan: vessel.name },
        create: { id: mmsi, keterangan: vessel.name },
      })
      synced.push(vessel)
    } catch (error) {
      console.error(`[VesselAPI] informasi ${mmsi} gagal:`, error.message)
    }
  }

  return { missing, synced }
}

function normalizeTelkomsatPosition(item) {
  if (!item || item.lat == null || item.lon == null) {
    throw new Error('Telkomsat response tidak berisi posisi yang valid')
  }

  const latitude = Number(item.lat)
  const longitude = Number(item.lon)
  const timestamp = Number(item.timestamp)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(timestamp)) {
    throw new Error('Telkomsat response tidak berisi posisi atau waktu yang valid')
  }

  return {
    mmsi: String(item.mmsi),
    name: item.name || item.ais_name || null,
    latitude,
    longitude,
    speed: item.sog == null ? null : Number(item.sog),
    timestamp: new Date(timestamp * 1000).toISOString(),
  }
}

async function fetchTelkomsatPositions({
  apiKey = process.env.TELKOMSAT_API_KEY,
  http = axios,
} = {}) {
  if (!apiKey) throw new Error('TELKOMSAT_API_KEY belum diisi')

  const form = new FormData()
  form.append('key', apiKey)
  const response = await http.post(TELKOMSAT_API_URL, form, {
    headers: form.getHeaders(),
    timeout: 30_000,
  })
  const data = response.data && response.data.data
  if (!Array.isArray(data)) throw new Error('Telkomsat response tidak berisi daftar kapal')
  return data.map(normalizeTelkomsatPosition)
}

async function savePosition(position, client = prisma, source = 'VesselAPI') {
  const gpsTime = new Date(position.timestamp)

  await client.device_gps.upsert({
    where: { id: position.mmsi },
    update: { nama_kapal: position.name },
    create: {
      id: position.mmsi,
      keterangan: source,
      nama_kapal: position.name,
    },
  })

  return client.device_gpsHits.create({
    data: {
      ObjectID: position.mmsi,
      Lat: position.latitude,
      Lon: position.longitude,
      Speed: position.speed,
      GPSTime: gpsTime,
      LastDataTime: gpsTime,
    },
  })
}

async function runOnce({
  mmsis = parseMmsis(),
  apiKey = process.env.VESSELAPI_API_KEY,
  telkomsatApiKey = process.env.TELKOMSAT_API_KEY,
  http = axios,
  client = prisma,
} = {}) {
  const positions = []

  if (mmsis.length && client.device_gps.findMany) {
    try {
      const result = await syncMissingVesselInformation({ mmsis, apiKey, http, client })
      if (result.missing.length) {
        console.log(`[VesselAPI] MMSI belum ada di database: ${result.missing.join(', ')}`)
      }
    } catch (error) {
      console.error('[VesselAPI] pengecekan informasi kapal gagal:', error.message)
    }
  }

  for (const mmsi of mmsis) {
    try {
      const position = await fetchPosition({ mmsi, apiKey, http })
      await savePosition(position, client)
      console.log(`[VesselAPI] ${position.mmsi} ${position.latitude},${position.longitude}`)
      positions.push(position)
    } catch (error) {
      console.error(`[VesselAPI] ${mmsi} gagal:`, error.message)
    }
  }

  if (telkomsatApiKey) {
    try {
      const telkomsatPositions = await fetchTelkomsatPositions({ apiKey: telkomsatApiKey, http })
      for (const position of telkomsatPositions) {
        await savePosition(position, client, 'Telkomsat my_vessel')
        console.log(`[Telkomsat] ${position.mmsi} ${position.latitude},${position.longitude}`)
        positions.push(position)
      }
    } catch (error) {
      console.error('[Telkomsat] gagal:', error.message)
    }
  }

  return positions
}

function start(intervalMs = INTERVAL_MS) {
  let running = false
  const execute = async () => {
    if (running) return
    running = true
    try {
      await runOnce()
    } catch (error) {
      console.error('[VesselAPI] Tracking gagal:', error.message)
    } finally {
      running = false
    }
  }

  execute()
  return setInterval(execute, intervalMs)
}

if (require.main === module) start()

module.exports = {
  fetchPosition,
  fetchVesselInformation,
  fetchTelkomsatPositions,
  normalizePosition,
  normalizeVesselInformation,
  normalizeTelkomsatPosition,
  parseMmsis,
  runOnce,
  savePosition,
  start,
  syncMissingVesselInformation,
}
