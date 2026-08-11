try {
  require('dotenv').config()
} catch {
  // Environment variables can also be provided directly by the process manager.
}

const axios = require('axios')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const API_URL = process.env.VESSELAPI_URL || 'https://api.vesselapi.com/v1'
const MMSI = process.env.VESSELAPI_MMSI || '525901342'
const INTERVAL_MS = 3 * 60 * 60 * 1000

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

async function savePosition(position, client = prisma) {
  const gpsTime = new Date(position.timestamp)

  await client.device_gps.upsert({
    where: { id: position.mmsi },
    update: { keterangan: 'VesselAPI', nama_kapal: position.name },
    create: {
      id: position.mmsi,
      keterangan: 'VesselAPI',
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

async function runOnce({ mmsis = parseMmsis(), apiKey, http = axios, client = prisma } = {}) {
  const positions = []

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

module.exports = { fetchPosition, normalizePosition, parseMmsis, runOnce, savePosition, start }
